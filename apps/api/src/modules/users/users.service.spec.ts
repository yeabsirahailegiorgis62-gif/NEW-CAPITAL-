import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockUser = {
    id: 'user-1',
    name: 'Abebe Kebede',
    email: 'abebe@capitalre.com',
    employeeId: 'EMP-001',
    passwordHash: '$2b$10$hashedpassword',
    role: UserRole.EMPLOYEE,
    departmentId: 'dept-1',
    phone: '+251911223344',
    avatarUrl: null,
    jobTitle: 'Senior Surveyor',
    licenseNumber: null,
    isActive: true,
    department: { id: 'dept-1', name: 'Logistics' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findMany: jest.fn().mockResolvedValue([mockUser]),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return safe users without passwordHash', async () => {
      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect((result[0] as any).passwordHash).toBeUndefined();
      expect(result[0].email).toBe('abebe@capitalre.com');
    });
  });

  describe('findOne', () => {
    it('should return a user without passwordHash', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      const result = await service.findOne('user-1');
      expect((result as any).passwordHash).toBeUndefined();
      expect(result.id).toBe('user-1');
    });

    it('should throw NotFoundException if user is not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create and return safe user with hashed password', async () => {
      jest.spyOn(prisma.user, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.user, 'create').mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'hash').mockImplementation(async () => '$2b$10$mockedHash');

      const result = await service.create({
        name: 'Abebe Kebede',
        email: 'abebe@capitalre.com',
        employeeId: 'EMP-001',
        password: 'Password123!',
        role: UserRole.EMPLOYEE,
      });

      expect((result as any).passwordHash).toBeUndefined();
      expect(result.email).toBe('abebe@capitalre.com');
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email or employeeId already exists', async () => {
      jest.spyOn(prisma.user, 'findFirst').mockResolvedValue(mockUser as any);

      await expect(
        service.create({
          name: 'Abebe',
          email: 'abebe@capitalre.com',
          password: 'pass',
          role: UserRole.EMPLOYEE,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateProfile', () => {
    it('should update profile attributes and strip passwordHash', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(prisma.user, 'update').mockResolvedValue({
        ...mockUser,
        phone: '+251999887766',
      } as any);

      const result = await service.updateProfile('user-1', {
        name: 'Abebe Kebede Updated',
        phone: '+251999887766',
      });

      expect((result as any).passwordHash).toBeUndefined();
      expect(result.phone).toBe('+251999887766');
    });
  });
});

