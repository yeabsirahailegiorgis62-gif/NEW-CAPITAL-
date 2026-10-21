import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService, DEFAULT_SYSTEM_SETTINGS } from './settings.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: PrismaService;

  const mockAdminUser = {
    id: 'admin-1',
    name: 'Super Admin',
    email: 'admin@capitalre.com',
    role: 'SUPER_ADMIN',
    passwordHash: '',
  };

  beforeAll(async () => {
    mockAdminUser.passwordHash = await bcrypt.hash('AdminSecret123!', 10);
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: PrismaService,
          useValue: {
            systemSetting: {
              findMany: jest.fn().mockResolvedValue([
                { key: 'minimumNoticeHours', value: '48' },
              ]),
              upsert: jest.fn().mockResolvedValue({}),
            },
            user: {
              findUnique: jest.fn().mockResolvedValue(mockAdminUser),
            },
            bookingDay: {
              count: jest.fn().mockResolvedValue(0),
            },
            booking: {
              count: jest.fn().mockResolvedValue(0),
            },
            notification: {
              count: jest.fn().mockResolvedValue(0),
            },
            auditLog: {
              count: jest.fn().mockResolvedValue(0),
              create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
            },
            $transaction: jest.fn().mockImplementation(async (callback) => {
              const tx = {
                bookingDay: { deleteMany: jest.fn() },
                vehicleAssignment: { deleteMany: jest.fn() },
                approval: { deleteMany: jest.fn() },
                booking: { deleteMany: jest.fn() },
                notification: { deleteMany: jest.fn() },
                auditLog: {
                  deleteMany: jest.fn(),
                  create: jest.fn().mockResolvedValue({ id: 'audit-destructive-1' }),
                },
              };
              return callback(tx);
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllSettings', () => {
    it('should return merged default settings and database overrides', async () => {
      const settings = await service.getAllSettings();
      expect(settings).toBeDefined();
      expect(settings.maxFailedLoginAttempts).toBe(DEFAULT_SYSTEM_SETTINGS.maxFailedLoginAttempts);
      expect(settings.minimumNoticeHours).toBe(48); // overridden from DB mock
    });
  });

  describe('updateSettings', () => {
    it('should persist modified settings and create audit log', async () => {
      const result = await service.updateSettings(
        {
          minimumNoticeHours: 12,
          allowSameDayRequests: true,
        },
        'admin-1',
      );

      expect(result).toBeDefined();
      expect(prisma.systemSetting.upsert).toHaveBeenCalledTimes(2);
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('purgeOperationsData (Danger Zone)', () => {
    it('should reject with BadRequestException when confirmation phrase does not match exactly', async () => {
      await expect(
        service.purgeOperationsData(
          {
            adminPassword: 'AdminSecret123!',
            confirmationPhrase: 'WRONG_PHRASE',
          },
          'admin-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject with ForbiddenException when admin password is wrong', async () => {
      await expect(
        service.purgeOperationsData(
          {
            adminPassword: 'WrongPassword!',
            confirmationPhrase: 'PERMANENTLY-DELETE-OPERATIONS-DATA',
          },
          'admin-1',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should execute purge transaction and record security audit log when authorized', async () => {
      const res = await service.purgeOperationsData(
        {
          adminPassword: 'AdminSecret123!',
          confirmationPhrase: 'PERMANENTLY-DELETE-OPERATIONS-DATA',
        },
        'admin-1',
      );

      expect(res.success).toBe(true);
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });
});
