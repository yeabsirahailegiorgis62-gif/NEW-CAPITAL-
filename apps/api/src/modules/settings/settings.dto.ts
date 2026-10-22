import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateSystemSettingsDto {
  // Login Security
  @ApiPropertyOptional({ default: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  maxFailedLoginAttempts?: number;

  @ApiPropertyOptional({ default: 15 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1440)
  accountLockoutDuration?: number;

  @ApiPropertyOptional({ default: 30 })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(1440)
  sessionTimeout?: number;

  // Password Policy
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  requireStrongPassword?: boolean;

  @ApiPropertyOptional({ default: 8 })
  @IsOptional()
  @IsNumber()
  @Min(6)
  @Max(64)
  minPasswordLength?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  requireUppercase?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  requireNumber?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  requireSpecialChar?: boolean;

  // Password Reset
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  forcePasswordChangeAfterReset?: boolean;

  @ApiPropertyOptional({ default: 30 })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(1440)
  passwordResetExpiresMinutes?: number;

  // Request Rules
  @ApiPropertyOptional({ default: 24 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(168)
  minimumNoticeHours?: number;

  @ApiPropertyOptional({ default: 14 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  maxPassengerCapacity?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allowSameDayRequests?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allowWeekendRequests?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allowHolidayRequests?: boolean;

  // Request Lifecycle
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  requireRequestApproval?: boolean;

  @ApiPropertyOptional({ default: 48 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(720)
  pendingRequestExpirationHours?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  allowCancelPending?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  allowEditPending?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allowCancelAfterApproval?: boolean;

  // Assignment Rules - Vehicles
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  preventDoubleVehicleAssignment?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  onlyShowAvailableVehicles?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  autoSuggestSuitableVehicle?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  requireVehicleInspectionCheck?: boolean;

  @ApiPropertyOptional({ default: 25 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minFuelLevelPercent?: number;

  // Assignment Rules - Drivers / Chauffeurs
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  preventDoubleDriverAssignment?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  onlyShowActiveDrivers?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  requireDriverConfirmation?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  requireValidDriverLicense?: boolean;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(24)
  maxDailyDriverHours?: number;

  @ApiPropertyOptional({ default: 4 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(72)
  driverConfirmationTimeoutHours?: number;
}

export class PurgeOperationsDataDto {
  @ApiProperty({ description: 'Current administrator password for re-authentication' })
  @IsNotEmpty()
  @IsString()
  adminPassword: string;

  @ApiProperty({ example: 'PERMANENTLY-DELETE-OPERATIONS-DATA', description: 'Explicit verification phrase' })
  @IsNotEmpty()
  @IsString()
  confirmationPhrase: string;
}
