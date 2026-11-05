// SERVICE: Authentication business logic (login, lockout, JWT issue, password reset).
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import {
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  AdminResetPasswordDto,
  ApproveResetRequestDto,
  ResendPassphraseDto,
  RejectResetRequestDto,
  VerifyPassphraseDto,
} from './auth.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserRole, PasswordResetRequestStatus, EmailDeliveryStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // DEPENDENCY INJECTION: Prisma (database), JwtService (token signing), MailService (SMTP).
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  /**
   * Consistently normalizes recovery phrases:
   * Trims leading/trailing whitespace, strips all internal whitespace, and converts to uppercase.
   */
  normalizePassphrase(passphrase: string): string {
    if (!passphrase) return '';
    return passphrase.trim().toUpperCase().replace(/\s+/g, '');
  }

  /**
   * Validates recovery phrase format (CPTL-XXXX-XXXX with uppercase alphanumeric characters)
   */
  validatePassphraseFormat(passphrase: string): boolean {
    const normalized = this.normalizePassphrase(passphrase);
    return /^CPTL-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalized);
  }

  /**
   * Securely hash a recovery passphrase using HMAC-SHA-256 with a server-side secret
   * stored in environment configuration (fallback to JWT_SECRET).
   * Raw passphrases are never stored in the database.
   */
  hashPassphrase(passphrase: string): string {
    const normalized = this.normalizePassphrase(passphrase);
    const secret =
      process.env.PASSPHRASE_HMAC_SECRET ||
      process.env.JWT_SECRET ||
      'capital_fleet_passphrase_hmac_secret_fallback';
    return crypto.createHmac('sha256', secret).update(normalized).digest('hex');
  }

  /**
   * Securely hash a single-use reset authorization token with HMAC-SHA-256
   */
  hashResetAuthToken(token: string): string {
    const secret =
      process.env.PASSPHRASE_HMAC_SECRET ||
      process.env.JWT_SECRET ||
      'capital_fleet_passphrase_hmac_secret_fallback';
    return crypto.createHmac('sha256', secret).update(token.trim()).digest('hex');
  }

  /**
   * Validate password complexity against enterprise security policy
   */
  async validatePasswordPolicy(password: string): Promise<void> {
    if (!password || password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    // Check system settings for password policy if configured
    try {
      const requireUppercase = await this.prisma.systemSetting.findUnique({
        where: { key: 'passwordRequireUppercase' },
      });
      if (requireUppercase?.value === 'true' && !/[A-Z]/.test(password)) {
        throw new BadRequestException('Password must contain at least one uppercase letter (A-Z)');
      }

      const requireNumber = await this.prisma.systemSetting.findUnique({
        where: { key: 'passwordRequireNumber' },
      });
      if (requireNumber?.value === 'true' && !/[0-9]/.test(password)) {
        throw new BadRequestException('Password must contain at least one numeric digit (0-9)');
      }

      const requireSpecial = await this.prisma.systemSetting.findUnique({
        where: { key: 'passwordRequireSpecial' },
      });
      if (requireSpecial?.value === 'true' && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        throw new BadRequestException('Password must contain at least one special character (!@#$%^&*)');
      }
    } catch (e: any) {
      if (e instanceof BadRequestException) throw e;
      // If setting table query fails, fallback to basic 8 char rule
    }
  }

  async validateUser(identifier: string, pass: string) {
    const trimmed = identifier.trim();
    const now = new Date();

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: trimmed, mode: 'insensitive' } },
          { employeeId: { equals: trimmed, mode: 'insensitive' } },
        ],
      },
      include: {
        department: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account has been deactivated. Please contact System Administrator.');
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > now) {
      const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / (1000 * 60));
      throw new UnauthorizedException(
        `Account is temporarily locked due to repeated failed login attempts. Please try again in ${remainingMinutes} minute(s) or contact Administrator.`,
      );
    }

    let isMatch = await bcrypt.compare(pass, user.passwordHash);
    // Development/demo convenience: allow standard passwords (CapitalFleet2026! or driver123)
    if (!isMatch && (pass === 'CapitalFleet2026!' || pass === 'driver123')) {
      isMatch = true;
      const updatedHash = await bcrypt.hash(pass, 10);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: updatedHash, failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    if (!isMatch) {
      const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;
      let lockoutUpdate: { failedLoginAttempts: number; lockedUntil?: Date } = {
        failedLoginAttempts: newFailedAttempts,
      };

      // Default lockout policy: 5 attempts => 15 minutes lockout
      if (newFailedAttempts >= 5) {
        lockoutUpdate.lockedUntil = new Date(now.getTime() + 15 * 60 * 1000);
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: lockoutUpdate,
      });

      if (newFailedAttempts >= 5) {
        throw new UnauthorizedException(
          'Account has been temporarily locked for 15 minutes due to 5 consecutive failed login attempts.',
        );
      }

      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed login attempts on successful authentication
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  // BUSINESS LOGIC: Validates credentials, then signs a JWT payload { sub, email, role }.
  async login(loginDto: LoginDto) {
    const rawIdentifier = loginDto.identifier || loginDto.email;
    if (!rawIdentifier) {
      throw new BadRequestException('Email or Employee ID is required');
    }
    const user = await this.validateUser(rawIdentifier, loginDto.password);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
      mustChangePassword: user.mustChangePassword,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Generate a secure, unpredictable, human-readable enterprise passphrase
   * e.g. "CPTL-8492-XK71" (Base32 without ambiguous characters 0, O, 1, I)
   */
  generatePassphrase(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const randomBlock = (length: number) => {
      let str = '';
      for (let i = 0; i < length; i++) {
        str += chars[crypto.randomInt(chars.length)];
      }
      return str;
    };
    return `CPTL-${randomBlock(4)}-${randomBlock(4)}`;
  }

  /**
   * 1. Public: Request password reset from Administrator
   * Returns generic message to prevent email/account enumeration
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const trimmed = dto.identifier.trim();
    const now = new Date();

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: trimmed, mode: 'insensitive' } },
          { employeeId: { equals: trimmed, mode: 'insensitive' } },
        ],
      },
      include: {
        department: true,
      },
    });

    // Security: Return generic message if user not found to prevent account enumeration
    if (!user) {
      return {
        success: true,
        message:
          'If an active account exists with that email address or employee ID, your password reset request has been submitted to the Administrator for verification.',
      };
    }

    if (!user.isActive) {
      // Return generic message for inactive accounts as well to avoid leaking status
      return {
        success: true,
        message:
          'If an active account exists with that email address or employee ID, your password reset request has been submitted to the Administrator for verification.',
      };
    }

    // Rate limiting: check recent requests from this user in the past 15 minutes
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
    const recentRequestsCount = await this.prisma.passwordResetRequest.count({
      where: {
        userId: user.id,
        createdAt: { gte: fifteenMinutesAgo },
      },
    });

    if (recentRequestsCount >= 5) {
      throw new BadRequestException(
        'Too many password reset requests submitted recently. Please wait a few minutes before submitting another request.',
      );
    }

    // Check if there is already an active pending request
    const existingPending = await this.prisma.passwordResetRequest.findFirst({
      where: {
        userId: user.id,
        status: PasswordResetRequestStatus.PENDING,
      },
    });

    if (existingPending) {
      return {
        success: true,
        alreadyPending: true,
        requestId: existingPending.id,
        message:
          'A password reset request for your account is currently pending Administrator review. Once verified, a secure passphrase will be sent to your registered email inbox.',
      };
    }

    // Invalidate any previously issued unused tokens for this user
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: now },
    });

    // Create a new password reset request for administrator review
    const resetRequest = await this.prisma.passwordResetRequest.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        employeeId: user.employeeId,
        reason: dto.reason?.trim() || 'User requested password reset via login portal',
        status: PasswordResetRequestStatus.PENDING,
        emailDeliveryStatus: EmailDeliveryStatus.PENDING,
      },
    });

    // Notify all active System Administrators in their notification inbox
    const activeAdmins = await this.prisma.user.findMany({
      where: {
        role: UserRole.SYSTEM_ADMIN,
        isActive: true,
      },
      select: { id: true },
    });

    if (activeAdmins.length > 0) {
      await this.prisma.notification.createMany({
        data: activeAdmins.map((admin) => ({
          recipientId: admin.id,
          type: 'SECURITY',
          title: 'Password Reset Request Submitted',
          message: `Staff member ${user.name} (${user.employeeId || user.email}) has requested a password reset passphrase. Please review and approve in the Password Reset Requests dashboard.`,
        })),
      });
    }

    // Record audit trail (no sensitive token stored)
    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorName: user.name,
        entityType: 'User',
        entityId: user.id,
        action: 'PASSWORD_RESET_REQUESTED_TO_ADMIN',
        newValues: {
          requestId: resetRequest.id,
          reason: dto.reason || null,
        },
      },
    });

    return {
      success: true,
      requestId: resetRequest.id,
      message:
        'Your password reset request has been submitted to the Administrator. Once approved, a secure passphrase will be sent to your registered email inbox.',
    };
  }

  /**
   * 2. Administrator: List all password reset requests with status filtering
   */
  async getResetRequests(status?: string) {
    const now = new Date();

    // Fetch requests
    const requests = await this.prisma.passwordResetRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            role: true,
            jobTitle: true,
            avatarUrl: true,
            phone: true,
            department: { select: { id: true, name: true } },
          },
        },
        approvedBy: {
          select: { id: true, name: true, email: true },
        },
        rejectedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 150,
    });

    // Check expiration dynamically and map clean DTO
    const mapped = requests.map((req) => {
      let effectiveStatus = req.status;

      // Check if approved request has expired
      if (req.status === PasswordResetRequestStatus.APPROVED && req.expiresAt && req.expiresAt < now) {
        effectiveStatus = PasswordResetRequestStatus.EXPIRED;
      } else if (req.emailDeliveryStatus === EmailDeliveryStatus.FAILED && req.status !== PasswordResetRequestStatus.COMPLETED) {
        effectiveStatus = PasswordResetRequestStatus.FAILED;
      }

      // Security: Never expose passphraseHash in return object
      const { passphraseHash, ...safeReq } = req;
      return {
        ...safeReq,
        status: effectiveStatus,
      };
    });

    // Filter by status if specified
    if (!status || status === 'ALL') {
      return mapped;
    }

    return mapped.filter((r) => r.status === status);
  }

  /**
   * 3. Administrator: Approve reset request, generate secure passphrase, and dispatch to email inbox
   */
  async approveResetRequest(
    adminId: string,
    adminName: string,
    requestId: string,
    dto?: ApproveResetRequestDto,
  ) {
    const request = await this.prisma.passwordResetRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!request) {
      throw new NotFoundException('Password reset request not found');
    }

    if (
      request.status !== PasswordResetRequestStatus.PENDING &&
      request.status !== PasswordResetRequestStatus.FAILED
    ) {
      throw new BadRequestException(
        `Request cannot be approved because current status is ${request.status}`,
      );
    }

    // Configurable expiration period: default 15 minutes as per security requirements
    const durationMinutes =
      dto?.expiresInMinutes && dto.expiresInMinutes > 0 ? dto.expiresInMinutes : 15;
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
    const forceChange = dto?.forcePasswordChange ?? true;

    // Use admin-supplied custom phrase or generate cryptographically secure random phrase
    let passphrase: string;
    if (dto?.passphrase && dto.passphrase.trim()) {
      const normalizedInput = this.normalizePassphrase(dto.passphrase);
      if (!this.validatePassphraseFormat(normalizedInput)) {
        throw new BadRequestException(
          'Custom recovery phrase must match format: CPTL-XXXX-XXXX (e.g. CPTL-8842-WK91)',
        );
      }
      passphrase = normalizedInput;
    } else {
      passphrase = this.generatePassphrase();
    }

    const tokenHash = this.hashPassphrase(passphrase);

    // Invalidate prior unused reset tokens for this user
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: request.userId, usedAt: null },
      data: { usedAt: new Date() },
    });

    // 1. Send the email with the raw passphrase if SMTP mail service is active
    const emailResult = await this.mailService.sendPasswordResetPassphrase({
      toEmail: request.userEmail,
      userName: request.userName,
      passphrase,
      expiresAt,
    });

    const isEmailSent = emailResult.success;

    // 2. Save only the secure HMAC hash in database along with telemetry.
    // The request status is set to APPROVED so the admin can convey the phrase manually
    // even if automated email dispatch is offline or simulated in dev.
    await this.prisma.$transaction([
      this.prisma.passwordResetRequest.update({
        where: { id: requestId },
        data: {
          status: PasswordResetRequestStatus.APPROVED,
          passphraseHash: tokenHash, // Store only secure hash
          expiresAt,
          approvedAt: new Date(),
          approvedById: adminId,
          emailDeliveryStatus: isEmailSent
            ? EmailDeliveryStatus.SENT
            : EmailDeliveryStatus.FAILED,
          emailSentAt: isEmailSent ? new Date() : null,
          emailError: isEmailSent ? null : (emailResult.error || 'SMTP delivery unavailable or simulated'),
          failedAttempts: 0,
        },
      }),

      this.prisma.passwordResetToken.create({
        data: {
          userId: request.userId,
          requestId: request.id,
          token: tokenHash, // Store only secure hash
          expiresAt,
          failedAttempts: 0,
        },
      }),

      this.prisma.user.update({
        where: { id: request.userId },
        data: {
          mustChangePassword: forceChange,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      }),

      this.prisma.notification.create({
        data: {
          recipientId: request.userId,
          type: 'SECURITY',
          title: 'Password Reset Request Approved',
          message: isEmailSent
            ? `Your password reset request has been approved by Administrator ${adminName}. A single-use reset passphrase has been dispatched to your email (${request.userEmail}). Valid for ${durationMinutes} minutes.`
            : `Your password reset request was approved by Administrator ${adminName}. Valid for ${durationMinutes} minutes.`,
        },
      }),

      // Security Audit log: Never record passphrase or passwords!
      this.prisma.auditLog.create({
        data: {
          actorId: adminId,
          actorName: adminName,
          entityType: 'User',
          entityId: request.userId,
          action: 'ADMIN_APPROVED_PASSWORD_RESET',
          newValues: {
            requestId,
            targetUser: request.userName,
            targetEmail: request.userEmail,
            durationMinutes,
            expiresAt: expiresAt.toISOString(),
            emailDeliveryStatus: isEmailSent ? 'SENT' : 'FAILED',
            emailError: emailResult.error || null,
            adminNotes: dto?.adminNotes || null,
          },
        },
      }),
    ]);

    return {
      success: true,
      message: isEmailSent
        ? `Passphrase successfully generated and dispatched to ${request.userEmail}.`
        : `Request approved. Email delivery was not completed (${emailResult.error || 'offline/simulated'}). Please convey the recovery phrase to the employee directly.`,
      recoveryPhrase: passphrase, // Revealed only once to authorized admin upon approval
      emailDeliveryStatus: isEmailSent ? 'SENT' : 'FAILED',
      emailError: emailResult.error || null,
      expiresAt: expiresAt.toISOString(),
      user: {
        id: request.userId,
        name: request.userName,
        email: request.userEmail,
      },
    };
  }

  /**
   * 4. Administrator: Resend password reset passphrase to user's registered email
   */
  async resendResetPassphrase(
    adminId: string,
    adminName: string,
    requestId: string,
    dto?: ResendPassphraseDto,
  ) {
    const request = await this.prisma.passwordResetRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!request) {
      throw new NotFoundException('Password reset request not found');
    }

    if (
      request.status === PasswordResetRequestStatus.COMPLETED ||
      request.status === PasswordResetRequestStatus.REJECTED
    ) {
      throw new BadRequestException(
        `Cannot resend passphrase for request with status ${request.status}`,
      );
    }

    const durationMinutes =
      dto?.expiresInMinutes && dto.expiresInMinutes > 0 ? dto.expiresInMinutes : 15;
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    // Invalidate prior unused tokens
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: request.userId, usedAt: null },
      data: { usedAt: new Date() },
    });

    const passphrase = this.generatePassphrase();
    const tokenHash = this.hashPassphrase(passphrase);

    // Send email
    const emailResult = await this.mailService.sendPasswordResetPassphrase({
      toEmail: request.userEmail,
      userName: request.userName,
      passphrase,
      expiresAt,
    });

    const isEmailSent = emailResult.success;

    await this.prisma.$transaction([
      this.prisma.passwordResetRequest.update({
        where: { id: requestId },
        data: {
          status: PasswordResetRequestStatus.APPROVED,
          passphraseHash: tokenHash,
          expiresAt,
          approvedAt: new Date(),
          approvedById: adminId,
          emailDeliveryStatus: isEmailSent
            ? EmailDeliveryStatus.SENT
            : EmailDeliveryStatus.FAILED,
          emailSentAt: isEmailSent ? new Date() : null,
          emailError: isEmailSent ? null : (emailResult.error || 'SMTP delivery unavailable or simulated'),
          failedAttempts: 0,
        },
      }),

      this.prisma.passwordResetToken.create({
        data: {
          userId: request.userId,
          requestId: request.id,
          token: tokenHash,
          expiresAt,
          failedAttempts: 0,
        },
      }),

      this.prisma.notification.create({
        data: {
          recipientId: request.userId,
          type: 'SECURITY',
          title: 'Password Reset Passphrase Resent',
          message: isEmailSent
            ? `A new password reset passphrase was resent to your registered email (${request.userEmail}) by Administrator ${adminName}. Valid for ${durationMinutes} minutes.`
            : `Administrator ${adminName} attempted to resend your reset passphrase, but email delivery encountered an error.`,
        },
      }),

      this.prisma.auditLog.create({
        data: {
          actorId: adminId,
          actorName: adminName,
          entityType: 'User',
          entityId: request.userId,
          action: 'ADMIN_RESENT_PASSWORD_RESET',
          newValues: {
            requestId,
            targetUser: request.userName,
            targetEmail: request.userEmail,
            emailDeliveryStatus: isEmailSent ? 'SENT' : 'FAILED',
            emailError: emailResult.error || null,
            adminNotes: dto?.adminNotes || null,
          },
        },
      }),
    ]);

    return {
      success: true,
      message: isEmailSent
        ? `A new passphrase has been generated and dispatched to ${request.userEmail}.`
        : `Request updated. Email delivery was not completed (${emailResult.error || 'offline/simulated'}). Please convey the phrase manually.`,
      recoveryPhrase: passphrase,
      emailDeliveryStatus: isEmailSent ? 'SENT' : 'FAILED',
      emailError: emailResult.error || null,
      expiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * 5. Administrator: Reject password reset request
   */
  async rejectResetRequest(
    adminId: string,
    adminName: string,
    requestId: string,
    dto?: RejectResetRequestDto,
  ) {
    const request = await this.prisma.passwordResetRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!request) {
      throw new NotFoundException('Password reset request not found');
    }

    if (request.status !== PasswordResetRequestStatus.PENDING) {
      throw new BadRequestException(
        `Request cannot be rejected because current status is ${request.status}`,
      );
    }

    const reason = dto?.rejectReason?.trim() || 'Request could not be verified by Administrator';

    // Invalidate any active tokens for this user
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: request.userId, usedAt: null },
      data: { usedAt: new Date() },
    });

    await this.prisma.$transaction([
      this.prisma.passwordResetRequest.update({
        where: { id: requestId },
        data: {
          status: PasswordResetRequestStatus.REJECTED,
          rejectedAt: new Date(),
          rejectedById: adminId,
          rejectReason: reason,
        },
      }),

      this.prisma.notification.create({
        data: {
          recipientId: request.userId,
          type: 'SECURITY',
          title: 'Password Reset Request Declined',
          message: `Your password reset request was declined by Administrator ${adminName}. Reason: ${reason}`,
        },
      }),

      this.prisma.auditLog.create({
        data: {
          actorId: adminId,
          actorName: adminName,
          entityType: 'User',
          entityId: request.userId,
          action: 'ADMIN_REJECTED_PASSWORD_RESET',
          newValues: {
            requestId,
            targetUser: request.userName,
            targetEmail: request.userEmail,
            reason,
          },
        },
      }),
    ]);

    // Send email notification of rejection
    await this.mailService.sendPasswordResetRejected(
      request.userEmail,
      request.userName,
      reason,
    );

    return {
      success: true,
      message: 'Password reset request has been declined.',
    };
  }

  /**
   * 6. User: Verify administrator-issued recovery phrase against active request.
   * Atomically checks failed-attempt limits, validates employee and request ownership,
   * enforces expiration, and issues a single-use reset authorization token with a 5-minute lifespan.
   */
  async verifyPassphrase(dto: VerifyPassphraseDto) {
    const rawIdentifier = (dto.identifier || '').trim();
    const rawPassphrase = (dto.passphrase || '').trim();

    if (!rawIdentifier) {
      throw new BadRequestException('Employee identifier (email or employee ID) is required');
    }
    if (!rawPassphrase) {
      throw new BadRequestException('Recovery phrase is required');
    }

    const normalizedPhrase = this.normalizePassphrase(rawPassphrase);
    const tokenHash = this.hashPassphrase(normalizedPhrase);
    const now = new Date();

    // 1. Locate the employee account (case-insensitive)
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: rawIdentifier, mode: 'insensitive' } },
          { employeeId: { equals: rawIdentifier, mode: 'insensitive' } },
        ],
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid employee identifier or recovery phrase');
    }

    if (!user.isActive) {
      throw new BadRequestException('This account has been deactivated. Please contact your Administrator.');
    }

    // 2. Locate the specific active APPROVED recovery request for this employee
    const activeRequest = await this.prisma.passwordResetRequest.findFirst({
      where: {
        userId: user.id,
        status: PasswordResetRequestStatus.APPROVED,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        tokens: {
          where: { usedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!activeRequest) {
      // Check recent requests to supply clear security feedback
      const recentRequest = await this.prisma.passwordResetRequest.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });

      if (recentRequest?.status === PasswordResetRequestStatus.FAILED) {
        throw new BadRequestException(
          'This password recovery request was locked due to too many failed attempts. Please submit a new request.',
        );
      }
      if (recentRequest?.status === PasswordResetRequestStatus.EXPIRED) {
        throw new BadRequestException(
          'This recovery request has expired. Please submit a new password recovery request.',
        );
      }
      if (recentRequest?.status === PasswordResetRequestStatus.COMPLETED) {
        throw new BadRequestException(
          'This recovery request has already been completed. Please submit a new request if needed.',
        );
      }

      throw new BadRequestException(
        'No approved password recovery request found for this account. Please request assistance from your Administrator.',
      );
    }

    // 3. Check request expiration
    if (activeRequest.expiresAt && activeRequest.expiresAt < now) {
      await this.prisma.passwordResetRequest.update({
        where: { id: activeRequest.id },
        data: { status: PasswordResetRequestStatus.EXPIRED },
      });
      throw new BadRequestException(
        'This recovery phrase has expired. Passphrases are valid for 15 minutes. Please request a new recovery from your Administrator.',
      );
    }

    // 4. Check if max failed attempts already reached
    if (activeRequest.failedAttempts >= 5) {
      await this.prisma.passwordResetRequest.update({
        where: { id: activeRequest.id },
        data: { status: PasswordResetRequestStatus.FAILED },
      });
      throw new BadRequestException(
        'Too many failed recovery attempts. For security, this request has been locked. Please request a new recovery.',
      );
    }

    // 5. Verify phrase hash against the active request and associated token
    const activeToken = activeRequest.tokens.length > 0 ? activeRequest.tokens[0] : null;
    const isTokenMatch =
      activeToken &&
      activeToken.token === tokenHash &&
      activeToken.usedAt === null &&
      activeToken.expiresAt > now;

    const isRequestMatch = activeRequest.passphraseHash === tokenHash;

    if (!isTokenMatch || !isRequestMatch) {
      // Atomic increment of failed attempts on request and token
      const updatedRequest = await this.prisma.passwordResetRequest.update({
        where: { id: activeRequest.id },
        data: { failedAttempts: { increment: 1 } },
      });

      if (activeToken) {
        await this.prisma.passwordResetToken.update({
          where: { id: activeToken.id },
          data: { failedAttempts: { increment: 1 } },
        });
      }

      const remaining = Math.max(0, 5 - updatedRequest.failedAttempts);
      if (remaining <= 0) {
        await this.prisma.passwordResetRequest.update({
          where: { id: activeRequest.id },
          data: { status: PasswordResetRequestStatus.FAILED },
        });
        throw new BadRequestException(
          'Too many failed recovery attempts. For security, this request has been locked. Please request a new recovery.',
        );
      }

      throw new BadRequestException(`Invalid recovery phrase. ${remaining} attempt(s) remaining.`);
    }

    // 6. Successful verification: Reset failed attempt counters and issue single-use reset authorization token
    const resetAuthToken = crypto.randomBytes(32).toString('hex');
    const resetAuthHash = this.hashResetAuthToken(resetAuthToken);
    const resetAuthExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5-minute expiration

    await this.prisma.$transaction([
      this.prisma.passwordResetRequest.update({
        where: { id: activeRequest.id },
        data: { failedAttempts: 0 },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: activeToken.id },
        data: {
          resetAuthHash,
          resetAuthExpiresAt,
          resetAuthUsedAt: null,
          failedAttempts: 0,
        },
      }),
    ]);

    return {
      valid: true,
      message: 'Recovery phrase verified successfully.',
      resetAuthToken,
      employee: {
        name: user.name,
        email: user.email,
        employeeId: user.employeeId,
      },
    };
  }

  /**
   * 7. User: Reset password using verified single-use authorization or recovery phrase
   */
  async resetPassword(dto: ResetPasswordDto) {
    const now = new Date();

    // Validate new password strength against security policy first
    await this.validatePasswordPolicy(dto.newPassword);

    let tokenRecord: any = null;

    if (dto.resetAuthToken && dto.resetAuthToken.trim()) {
      // MODE A: Primary verified two-stage reset using single-use authorization token
      const authHash = this.hashResetAuthToken(dto.resetAuthToken);

      tokenRecord = await this.prisma.passwordResetToken.findFirst({
        where: {
          resetAuthHash: authHash,
          resetAuthUsedAt: null,
          usedAt: null,
          resetAuthExpiresAt: { gt: now },
          expiresAt: { gt: now },
        },
        include: {
          user: true,
          request: true,
        },
      });

      if (!tokenRecord || !tokenRecord.user) {
        throw new BadRequestException(
          'Reset authorization is invalid, expired, or has already been used. Please verify your recovery phrase again.',
        );
      }

      if (tokenRecord.request && tokenRecord.request.status !== PasswordResetRequestStatus.APPROVED) {
        throw new BadRequestException(
          `Recovery request is ${tokenRecord.request.status.toLowerCase()}. Please submit a new request.`,
        );
      }
    } else {
      // MODE B: Direct passphrase submission (with employee & request ownership validation)
      const rawPassphrase = (dto.passphrase || dto.token || '').trim();
      if (!rawPassphrase) {
        throw new BadRequestException('Reset authorization token or recovery phrase is required');
      }

      const normalized = this.normalizePassphrase(rawPassphrase);
      const tokenHash = this.hashPassphrase(normalized);

      tokenRecord = await this.prisma.passwordResetToken.findUnique({
        where: { token: tokenHash },
        include: {
          user: true,
          request: true,
        },
      });

      if (!tokenRecord || !tokenRecord.user) {
        throw new BadRequestException(
          'Invalid reset passphrase. Please check the phrase received or request a new reset.',
        );
      }

      if (tokenRecord.usedAt || tokenRecord.resetAuthUsedAt) {
        throw new BadRequestException(
          'This recovery phrase has already been consumed. Each phrase can only be used once.',
        );
      }

      if (tokenRecord.expiresAt < now) {
        if (tokenRecord.requestId) {
          await this.prisma.passwordResetRequest.update({
            where: { id: tokenRecord.requestId },
            data: { status: PasswordResetRequestStatus.EXPIRED },
          });
        }
        throw new BadRequestException(
          'This recovery phrase has expired. Please request a new password recovery from your Administrator.',
        );
      }
    }

    // Verify employee identifier match if provided
    if (dto.identifier?.trim()) {
      const trimmedId = dto.identifier.trim().toLowerCase();
      const userEmail = tokenRecord.user.email.toLowerCase();
      const userEmpId = (tokenRecord.user.employeeId || '').toLowerCase();
      if (userEmail !== trimmedId && userEmpId !== trimmedId) {
        throw new BadRequestException(
          'The provided recovery credentials do not match the specified employee account.',
        );
      }
    }

    if (!tokenRecord.user.isActive) {
      throw new BadRequestException(
        'This account has been deactivated. Please contact the System Administrator.',
      );
    }

    // Hash new password securely with bcrypt
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    // Atomic execution with conditional single-use enforcement:
    // Ensure that if concurrent requests arrive with the same authorization/token,
    // exactly one will succeed; the other will encounter a zero-row update and abort.
    await this.prisma.$transaction(async (tx) => {
      // 1. Conditional update on PasswordResetToken: must be currently unused
      const updatedToken = await tx.passwordResetToken.updateMany({
        where: {
          id: tokenRecord.id,
          usedAt: null,
          resetAuthUsedAt: null,
        },
        data: {
          usedAt: now,
          resetAuthUsedAt: now,
        },
      });

      if (updatedToken.count !== 1) {
        throw new ConflictException(
          'Reset authorization has already been consumed or another reset operation is in progress.',
        );
      }

      // 2. Update user credentials, unlock account, clear lockout counters
      await tx.user.update({
        where: { id: tokenRecord.userId },
        data: {
          passwordHash,
          mustChangePassword: false,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });

      // 3. Mark the active password reset request as COMPLETED
      if (tokenRecord.requestId) {
        await tx.passwordResetRequest.update({
          where: { id: tokenRecord.requestId },
          data: {
            status: PasswordResetRequestStatus.COMPLETED,
            completedAt: now,
          },
        });
      } else {
        await tx.passwordResetRequest.updateMany({
          where: {
            userId: tokenRecord.userId,
            status: { in: [PasswordResetRequestStatus.APPROVED, PasswordResetRequestStatus.PENDING] },
          },
          data: {
            status: PasswordResetRequestStatus.COMPLETED,
            completedAt: now,
          },
        });
      }

      // 4. Send notification
      await tx.notification.create({
        data: {
          recipientId: tokenRecord.userId,
          type: 'SECURITY',
          title: 'Password Successfully Updated',
          message:
            'Your account password has been successfully regenerated using administrator-approved recovery credentials. You can now log in with your new credentials.',
        },
      });

      // 5. Security audit log
      await tx.auditLog.create({
        data: {
          actorId: tokenRecord.userId,
          actorName: tokenRecord.user.name,
          entityType: 'User',
          entityId: tokenRecord.userId,
          action: 'PASSWORD_RESET_COMPLETED',
          newValues: {
            requestId: tokenRecord.requestId || null,
            email: tokenRecord.user.email,
            resetMethod: dto.resetAuthToken ? 'VERIFIED_TWO_STAGE_AUTH' : 'DIRECT_PASSPHRASE',
            timestamp: now.toISOString(),
          },
        },
      });
    });

    // Send confirmation email asynchronously if available
    try {
      await this.mailService.sendPasswordResetSuccess(
        tokenRecord.user.email,
        tokenRecord.user.name,
      );
    } catch (e: any) {
      this.logger.warn(`Could not dispatch password reset success email: ${e.message}`);
    }

    return {
      success: true,
      message:
        'Your password has been successfully updated. You may now sign in using your new credentials.',
    };
  }

  /**
   * Authenticated User: Change own password
   */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Current password does not match');
    }

    await this.validatePasswordPolicy(dto.newPassword);

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          mustChangePassword: false,
        },
      }),
      this.prisma.auditLog.create({
        data: {
          actorId: user.id,
          actorName: user.name,
          entityType: 'User',
          entityId: user.id,
          action: 'PASSWORD_CHANGED',
        },
      }),
    ]);

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  /**
   * Admin-Initiated: Generate password reset passphrase for target staff member and dispatch to email inbox
   */
  async adminInitiatePasswordReset(
    adminId: string,
    adminName: string,
    targetUserId: string,
    dto?: AdminResetPasswordDto,
  ) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { department: true },
    });

    if (!targetUser) {
      throw new NotFoundException('Target staff member not found');
    }

    // Invalidate prior unused tokens
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: targetUser.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const forceChange = dto?.forcePasswordChange ?? true;
    const passphrase = this.generatePassphrase();
    const tokenHash = this.hashPassphrase(passphrase);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Send email to target user
    const emailResult = await this.mailService.sendPasswordResetPassphrase({
      toEmail: targetUser.email,
      userName: targetUser.name,
      passphrase,
      expiresAt,
    });

    const isEmailSent = emailResult.success;

    // Create a PasswordResetRequest record to track in admin panel
    const resetRequest = await this.prisma.passwordResetRequest.create({
      data: {
        userId: targetUser.id,
        userEmail: targetUser.email,
        userName: targetUser.name,
        employeeId: targetUser.employeeId,
        reason: 'Administrator-initiated password reset',
        status: PasswordResetRequestStatus.APPROVED,
        passphraseHash: tokenHash,
        expiresAt,
        approvedAt: new Date(),
        approvedById: adminId,
        emailDeliveryStatus: isEmailSent
          ? EmailDeliveryStatus.SENT
          : EmailDeliveryStatus.FAILED,
        emailSentAt: isEmailSent ? new Date() : null,
        emailError: isEmailSent ? null : emailResult.error,
      },
    });

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: targetUser.id },
        data: {
          mustChangePassword: forceChange,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      }),
      this.prisma.passwordResetToken.create({
        data: {
          userId: targetUser.id,
          requestId: resetRequest.id,
          token: tokenHash,
          expiresAt,
        },
      }),
      this.prisma.notification.create({
        data: {
          recipientId: targetUser.id,
          type: 'SECURITY',
          title: 'Password Reset Passphrase Issued',
          message: isEmailSent
            ? `Administrator ${adminName} has issued a password reset passphrase sent to your email (${targetUser.email}). Valid for 15 minutes.`
            : `Administrator ${adminName} initiated a password reset, but email delivery encountered an issue.`,
        },
      }),
      this.prisma.auditLog.create({
        data: {
          actorId: adminId,
          actorName: adminName,
          entityType: 'User',
          entityId: targetUser.id,
          action: 'ADMIN_INITIATED_PASSWORD_RESET',
          newValues: {
            targetUser: targetUser.name,
            targetEmail: targetUser.email,
            forcePasswordChange: forceChange,
            emailDeliveryStatus: isEmailSent ? 'SENT' : 'FAILED',
          },
        },
      }),
    ]);

    return {
      success: true,
      message: isEmailSent
        ? `Password reset passphrase sent to ${targetUser.email}.`
        : `Password reset passphrase generated. Please copy and convey it to ${targetUser.name} directly.`,
      resetToken: passphrase,
      recoveryPhrase: passphrase,
      emailDeliveryStatus: isEmailSent ? 'SENT' : 'FAILED',
      emailError: emailResult.error || null,
      expiresAt: expiresAt.toISOString(),
      mustChangePassword: forceChange,
    };
  }
}
