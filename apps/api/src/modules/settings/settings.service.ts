import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSystemSettingsDto, PurgeOperationsDataDto } from './settings.dto';
import * as bcrypt from 'bcrypt';

export const DEFAULT_SYSTEM_SETTINGS: Record<string, any> = {
  // Login Security
  maxFailedLoginAttempts: 5,
  accountLockoutDuration: 15, // minutes
  sessionTimeout: 30, // minutes

  // Password Policy
  requireStrongPassword: true,
  minPasswordLength: 8,
  requireUppercase: true,
  requireNumber: true,
  requireSpecialChar: true,

  // Password Reset
  forcePasswordChangeAfterReset: true,
  passwordResetExpiresMinutes: 30,

  // Request Rules
  minimumNoticeHours: 0,
  maxPassengerCapacity: 14,
  allowSameDayRequests: true,
  allowWeekendRequests: true,
  allowHolidayRequests: true,

  // Request Lifecycle
  requireRequestApproval: true,
  pendingRequestExpirationHours: 48,
  allowCancelPending: true,
  allowEditPending: true,
  allowCancelAfterApproval: false,

  // Assignment Rules - Vehicles
  preventDoubleVehicleAssignment: true,
  onlyShowAvailableVehicles: true,
  autoSuggestSuitableVehicle: true,
  requireVehicleInspectionCheck: true,
  minFuelLevelPercent: 25,

  // Assignment Rules - Drivers / Chauffeurs
  preventDoubleDriverAssignment: true,
  onlyShowActiveDrivers: true,
  requireDriverConfirmation: true,
  requireValidDriverLicense: true,
  maxDailyDriverHours: 10,
  driverConfirmationTimeoutHours: 4,
};

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getAllSettings(): Promise<Record<string, any>> {
    const records = await this.prisma.systemSetting.findMany();
    const result: Record<string, any> = { ...DEFAULT_SYSTEM_SETTINGS };

    for (const record of records) {
      try {
        result[record.key] = JSON.parse(record.value);
      } catch {
        result[record.key] = record.value;
      }
    }

    return result;
  }

  async updateSettings(dto: UpdateSystemSettingsDto, adminUserId: string): Promise<Record<string, any>> {
    const entries = Object.entries(dto).filter(([_, value]) => value !== undefined);

    for (const [key, value] of entries) {
      await this.prisma.systemSetting.upsert({
        where: { key },
        create: {
          key,
          value: JSON.stringify(value),
          category: this.getCategoryForKey(key),
          description: `Configured system setting for ${key}`,
        },
        update: {
          value: JSON.stringify(value),
        },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        actorId: adminUserId,
        actorName: 'System Administrator',
        action: 'UPDATE_SYSTEM_SETTINGS',
        entityType: 'SYSTEM_SETTINGS',
        entityId: 'SYSTEM',
        newValues: Object.fromEntries(entries),
      },
    });

    return this.getAllSettings();
  }

  async purgeOperationsData(dto: PurgeOperationsDataDto, adminUserId: string) {
    if (dto.confirmationPhrase !== 'PERMANENTLY-DELETE-OPERATIONS-DATA') {
      throw new BadRequestException(
        'Invalid confirmation phrase. Operation aborted. You must type "PERMANENTLY-DELETE-OPERATIONS-DATA" exactly.',
      );
    }

    const admin = await this.prisma.user.findUnique({
      where: { id: adminUserId },
    });
    if (!admin) {
      throw new NotFoundException('Administrator account not found.');
    }

    const isMatch = await bcrypt.compare(dto.adminPassword, admin.passwordHash);
    if (!isMatch) {
      throw new ForbiddenException('Invalid administrator credentials. Destructive operation rejected.');
    }

    const counts = {
      bookingDays: await this.prisma.bookingDay.count(),
      bookings: await this.prisma.booking.count(),
      notifications: await this.prisma.notification.count(),
      operationalLogs: await this.prisma.auditLog.count({
        where: { NOT: { action: { startsWith: 'SECURITY_' } } },
      }),
    };

    await this.prisma.$transaction(async (tx) => {
      // 1. Delete all booking days
      await tx.bookingDay.deleteMany({});

      // 2. Delete all bookings
      await tx.booking.deleteMany({});

      // 3. Delete all notifications
      await tx.notification.deleteMany({});

      // 4. Delete operational audit logs, keeping security logs
      await tx.auditLog.deleteMany({
        where: { NOT: { action: { startsWith: 'SECURITY_' } } },
      });
    });

    // Record permanent security audit log
    await this.prisma.auditLog.create({
      data: {
        actorId: adminUserId,
        actorName: admin.name || 'System Administrator',
        action: 'SECURITY_PURGE_OPERATIONS_DATA',
        entityType: 'OPERATIONS_DATA',
        entityId: 'SYSTEM',
        newValues: {
          purgedAt: new Date().toISOString(),
          purgedByAdmin: admin.email,
          recordsDeleted: counts,
        },
      },
    });

    return {
      success: true,
      message: 'Transport operations data has been permanently and safely deleted.',
      purgedSummary: counts,
      retained: ['Users', 'Drivers', 'Vehicles', 'Departments', 'System Settings', 'Security Audit Logs'],
    };
  }

  private getCategoryForKey(key: string): string {
    if (['maxFailedLoginAttempts', 'accountLockoutDuration', 'sessionTimeout'].includes(key)) return 'LOGIN_SECURITY';
    if (['requireStrongPassword', 'minPasswordLength', 'requireUppercase', 'requireNumber', 'requireSpecialChar'].includes(key)) return 'PASSWORD_POLICY';
    if (['forcePasswordChangeAfterReset', 'passwordResetExpiresMinutes'].includes(key)) return 'PASSWORD_RESET';
    if (['minimumNoticeHours', 'maxPassengerCapacity', 'allowSameDayRequests', 'allowWeekendRequests', 'allowHolidayRequests'].includes(key)) return 'REQUEST_RULES';
    if (['requireRequestApproval', 'pendingRequestExpirationHours', 'allowCancelPending', 'allowEditPending', 'allowCancelAfterApproval'].includes(key)) return 'REQUEST_LIFECYCLE';
    if (['preventDoubleVehicleAssignment', 'onlyShowAvailableVehicles', 'autoSuggestSuitableVehicle', 'requireVehicleInspectionCheck', 'minFuelLevelPercent'].includes(key)) return 'VEHICLE_ASSIGNMENT_RULES';
    if (['preventDoubleDriverAssignment', 'onlyShowActiveDrivers', 'requireDriverConfirmation', 'requireValidDriverLicense', 'maxDailyDriverHours', 'driverConfirmationTimeoutHours'].includes(key)) return 'DRIVER_ASSIGNMENT_RULES';
    return 'GENERAL';
  }
}
