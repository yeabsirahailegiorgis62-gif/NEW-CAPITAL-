import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import {
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  AdminResetPasswordDto,
} from './auth.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

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

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
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

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.identifier, loginDto.password);

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
   * Self-Service: Request password reset token
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const trimmed = dto.identifier.trim();
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: trimmed, mode: 'insensitive' } },
          { employeeId: { equals: trimmed, mode: 'insensitive' } },
        ],
      },
    });

    // If user does not exist, return generic success to prevent email enumeration
    if (!user) {
      return {
        success: true,
        message: 'If an active account with that identifier exists, a password reset token has been issued.',
      };
    }

    // Invalidate prior unused tokens
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    // Check configured expiration minutes (default: 30 minutes)
    let expireMinutes = 30;
    try {
      const expSetting = await this.prisma.systemSetting.findUnique({
        where: { key: 'passwordResetExpiresAfterMinutes' },
      });
      if (expSetting?.value) {
        expireMinutes = parseInt(expSetting.value, 10) || 30;
      }
    } catch {
      // fallback
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + expireMinutes * 60 * 1000);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorName: user.name,
        entityType: 'User',
        entityId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        newValues: { expiresAt: expiresAt.toISOString() },
      },
    });

    return {
      success: true,
      message: 'If an active account with that identifier exists, a password reset token has been issued.',
      // Provided for local testing and display in environments without live external SMTP gateways
      resetToken: token,
      expiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * Self-Service: Reset password using token
   */
  async resetPassword(dto: ResetPasswordDto) {
    const resetRecord = await this.prisma.passwordResetToken.findFirst({
      where: {
        token: dto.token.trim(),
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!resetRecord || !resetRecord.user) {
      throw new BadRequestException('Invalid or expired password reset token. Please request a new reset link.');
    }

    await this.validatePasswordPolicy(dto.newPassword);

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetRecord.userId },
        data: {
          passwordHash,
          mustChangePassword: false,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: now },
      }),
      this.prisma.auditLog.create({
        data: {
          actorId: resetRecord.userId,
          actorName: resetRecord.user.name,
          entityType: 'User',
          entityId: resetRecord.userId,
          action: 'PASSWORD_RESET_COMPLETED',
        },
      }),
    ]);

    return {
      success: true,
      message: 'Your password has been successfully reset. You may now log in with your new credentials.',
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
   * Admin-Initiated: Generate password reset for target staff member
   */
  async adminInitiatePasswordReset(adminId: string, adminName: string, targetUserId: string, dto?: AdminResetPasswordDto) {
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

    // Check policy for force change
    const forceChange = dto?.forcePasswordChange ?? true;
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour for admin resets

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
          token,
          expiresAt,
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
          },
        },
      }),
    ]);

    return {
      success: true,
      message: `Password reset initiated for ${targetUser.name}`,
      resetToken: token,
      expiresAt: expiresAt.toISOString(),
      mustChangePassword: forceChange,
    };
  }
}
