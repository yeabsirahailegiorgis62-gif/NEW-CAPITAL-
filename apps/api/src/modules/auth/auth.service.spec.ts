import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
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
              updateMany: jest.fn(),
            },
            passwordResetRequest: {
              create: jest.fn(),
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn().mockResolvedValue(0),
              update: jest.fn(),
              updateMany: jest.fn(),
            },
            notification: {
              create: jest.fn(),
              createMany: jest.fn(),
            },
            auditLog: {
              create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock_jwt_token_xyz'),
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

    it('should allow admin to approve request and dispatch passphrase to user email inbox', async () => {
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
      (prisma.$transaction as jest.Mock).mockImplementation(async (fns) => {
        return Promise.all(fns);
      });

      const res = await service.approveResetRequest('admin-1', 'Admin Super', 'req-1', {
        expiresInMinutes: 15,
      });

      expect(res.success).toBe(true);
      expect(res.emailDeliveryStatus).toBe('SENT');
      expect(res.message).toContain('dispatched');
    });

    it('should regenerate password using issued passphrase', async () => {
      const passphrase = 'CPTL-TEST-1234';
      const tokenHash = (service as any).hashPassphrase(passphrase);
      const mockToken = {
        id: 'tok-1',
        token: tokenHash,
        userId: mockUser.id,
        user: mockUser,
        expiresAt: new Date(Date.now() + 100000),
        usedAt: null,
      };
      (prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue(mockToken);
      (prisma.$transaction as jest.Mock).mockImplementation(async (fns) => {
        return Promise.all(fns);
      });

      const res = await service.resetPassword({
        token: passphrase,
        newPassword: 'BrandNewPassword2026!',
      });

      expect(res.success).toBe(true);
      expect(res.message).toContain('successfully updated');
    });
  });
});
