import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

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
              update: jest.fn().mockResolvedValue(mockUser),
            },
            systemSetting: {
              findMany: jest.fn().mockResolvedValue([]),
              findUnique: jest.fn(),
            },
            passwordResetToken: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            auditLog: {
              create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock_jwt_token_xyz'),
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
});
