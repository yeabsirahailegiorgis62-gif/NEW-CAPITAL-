import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole, PasswordResetRequestStatus } from '@prisma/client';
import { MailService } from '../mail/mail.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockUser = {
    id: 'user-1',
    employeeId: 'EMP-101',
    name: 'Dawit Kebede',
    email: 'employee@capitalre.com',
    passwordHash: '',
    role: UserRole.EMPLOYEE,
    departmentId: 'dept-1',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    department: { id: 'dept-1', name: 'Engineering' },
  };

  beforeAll(async () => {
    mockUser.passwordHash = await bcrypt.hash('CapitalFleet2026!', 10);
  });

  beforeEach(async () => {
    const mockPrisma: any = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn().mockResolvedValue(mockUser),
      },
      systemSetting: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
      },
      passwordResetToken: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      passwordResetRequest: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      notification: {
        create: jest.fn(),
        createMany: jest.fn(),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      },
      $transaction: jest.fn().mockImplementation(async (arg) => {
        if (typeof arg === 'function') {
          return arg(mockPrisma);
        }
        return Promise.all(arg);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock_jwt_token_xyz'),
            verify: jest.fn().mockReturnValue({ sub: 'user-1' }),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendPasswordResetPassphrase: jest.fn().mockResolvedValue({ success: true }),
            sendPasswordResetSuccess: jest.fn().mockResolvedValue({ success: true }),
            sendPasswordResetRejected: jest.fn().mockResolvedValue({ success: true }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('normalizePassphrase', () => {
    it('should trim outer whitespace, remove all internal spaces, and uppercase', () => {
      expect(service.normalizePassphrase('  cptl - 8842 - wk91  ')).toBe('CPTL-8842-WK91');
      expect(service.normalizePassphrase('cptl-abcd-1234')).toBe('CPTL-ABCD-1234');
      expect(service.normalizePassphrase('CPTL -  7482 -   XK91')).toBe('CPTL-7482-XK91');
    });

    it('should validate format correctly', () => {
      expect(service.validatePassphraseFormat('CPTL-8842-WK91')).toBe(true);
      expect(service.validatePassphraseFormat('  cptl - 8842 - wk91 ')).toBe(true);
      expect(service.validatePassphraseFormat('INVALID-FORMAT')).toBe(false);
    });
  });

  describe('validateUser', () => {
    it('should validate user with correct email and password', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.validateUser('employee@capitalre.com', 'CapitalFleet2026!');
      expect(result).toBeDefined();
      expect(result.id).toBe('user-1');
      expect(result.email).toBe('employee@capitalre.com');
      expect((result as any).passwordHash).toBeUndefined();
    });

    it('should validate user with employee ID', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.validateUser('EMP-101', 'CapitalFleet2026!');
      expect(result).toBeDefined();
      expect(result.id).toBe('user-1');
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.validateUser('nonexistent@capitalre.com', 'pwd')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.validateUser('employee@capitalre.com', 'WrongPassword123')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when account is inactive', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(service.validateUser('employee@capitalre.com', 'CapitalFleet2026!')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('login', () => {
    it('should return accessToken and safe user details upon successful login', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

      const response = await service.login({
        identifier: 'employee@capitalre.com',
        password: 'CapitalFleet2026!',
      });

      expect(response).toBeDefined();
      expect(response.accessToken).toBe('mock_jwt_token_xyz');
      expect(response.user.email).toBe('employee@capitalre.com');
      expect((response.user as any).passwordHash).toBeUndefined();
    });
  });

  describe('forgotPassword & passphrase workflow', () => {
    it('should create a pending reset request and notify admins', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (prisma.passwordResetRequest.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.passwordResetRequest.create as jest.Mock).mockResolvedValue({
        id: 'req-1',
        userId: mockUser.id,
        status: 'PENDING',
      });
      (prisma.user.findMany as jest.Mock).mockResolvedValue([{ id: 'admin-1' }]);
      (prisma.notification.createMany as jest.Mock).mockResolvedValue({ count: 1 });

      const res = await service.forgotPassword({ identifier: 'employee@capitalre.com' });
      expect(res.success).toBe(true);
      expect(res.requestId).toBe('req-1');
      expect(prisma.passwordResetRequest.create).toHaveBeenCalled();
      expect(prisma.notification.createMany).toHaveBeenCalled();
    });

    it('should allow admin to approve request, return recovery phrase once, and update status', async () => {
      const mockReq = {
        id: 'req-1',
        userId: mockUser.id,
        userEmail: mockUser.email,
        userName: mockUser.name,
        status: 'PENDING',
        user: mockUser,
      };
      (prisma.passwordResetRequest.findUnique as jest.Mock).mockResolvedValue(mockReq);
      (prisma.passwordResetToken.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

      const res = await service.approveResetRequest('admin-1', 'Admin Super', 'req-1', {
        expiresInMinutes: 15,
        passphrase: 'CPTL-8842-WK91',
      });

      expect(res.success).toBe(true);
      expect(res.recoveryPhrase).toBe('CPTL-8842-WK91');
      expect(res.emailDeliveryStatus).toBe('SENT');
    });

    it('should verify recovery phrase and issue single-use reset authorization token', async () => {
      const passphrase = 'CPTL-TEST-1234';
      const tokenHash = service.hashPassphrase(passphrase);
      const mockToken = {
        id: 'tok-1',
        token: tokenHash,
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 100000),
        usedAt: null,
      };
      const mockActiveReq = {
        id: 'req-1',
        userId: mockUser.id,
        status: PasswordResetRequestStatus.APPROVED,
        passphraseHash: tokenHash,
        expiresAt: new Date(Date.now() + 100000),
        failedAttempts: 0,
        tokens: [mockToken],
      };

      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (prisma.passwordResetRequest.findFirst as jest.Mock).mockResolvedValue(mockActiveReq);

      const result = await service.verifyPassphrase({
        identifier: 'EMP-101',
        passphrase: '  cptl - test - 1234  ', // With whitespace and lowercase
      });

      expect(result.valid).toBe(true);
      expect(result.resetAuthToken).toBeDefined();
      expect(result.employee.name).toBe(mockUser.name);
    });

    it('should reject invalid phrase and increment failed attempts counter', async () => {
      const validHash = service.hashPassphrase('CPTL-CORRECT-1111');
      const mockActiveReq = {
        id: 'req-1',
        userId: mockUser.id,
        status: PasswordResetRequestStatus.APPROVED,
        passphraseHash: validHash,
        expiresAt: new Date(Date.now() + 100000),
        failedAttempts: 1,
        tokens: [{ id: 'tok-1', token: validHash, usedAt: null, expiresAt: new Date(Date.now() + 100000) }],
      };

      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (prisma.passwordResetRequest.findFirst as jest.Mock).mockResolvedValue(mockActiveReq);
      (prisma.passwordResetRequest.update as jest.Mock).mockResolvedValue({
        ...mockActiveReq,
        failedAttempts: 2,
      });

      await expect(
        service.verifyPassphrase({
          identifier: 'EMP-101',
          passphrase: 'CPTL-WRONG-9999',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should regenerate password using verified resetAuthToken', async () => {
      const mockToken = {
        id: 'tok-1',
        token: 'hashed_token',
        userId: mockUser.id,
        user: mockUser,
        resetAuthHash: service.hashResetAuthToken('valid_auth_token_123'),
        resetAuthExpiresAt: new Date(Date.now() + 100000),
        resetAuthUsedAt: null,
        expiresAt: new Date(Date.now() + 100000),
        usedAt: null,
        request: {
          id: 'req-1',
          status: PasswordResetRequestStatus.APPROVED,
        },
      };

      (prisma.passwordResetToken.findFirst as jest.Mock).mockResolvedValue(mockToken);
      (prisma.passwordResetToken.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      const res = await service.resetPassword({
        resetAuthToken: 'valid_auth_token_123',
        newPassword: 'BrandNewPassword2026!',
      });

      expect(res.success).toBe(true);
      expect(res.message).toContain('successfully updated');
    });
  });
});
