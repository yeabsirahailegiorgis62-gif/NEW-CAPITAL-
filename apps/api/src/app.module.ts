// MODULE: Root NestJS module. Registers every feature module so controllers and
// services become part of one application.
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { IssuesModule } from './modules/issues/issues.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditModule } from './modules/audit/audit.module';
import { HealthModule } from './modules/health/health.module';
import { SettingsModule } from './modules/settings/settings.module';

import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { FuelModule } from './modules/fuel/fuel.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    DepartmentsModule,
    VehiclesModule,
    BookingsModule,
    IssuesModule,
    NotificationsModule,
    AuditModule,
    HealthModule,
    SettingsModule,
    MaintenanceModule,
    FuelModule,
  ],
})
export class AppModule {}
