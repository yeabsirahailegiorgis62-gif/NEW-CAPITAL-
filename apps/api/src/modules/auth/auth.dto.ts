// DTO: Request-body shapes for authentication endpoints. class-validator enforces rules.
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiPropertyOptional({
    example: 'employee@capitalre.com',
    description: 'Corporate email or assigned employee ID (e.g. EMP-101)',
  })
  @IsOptional()
  @IsString()
  identifier?: string;

  @ApiPropertyOptional({
    example: 'employee@capitalre.com',
    description: 'Corporate email address',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({
    example: 'CapitalFleet2026!',
    description: 'Account password',
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  password: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'employee@capitalre.com',
    description: 'Corporate email or assigned employee ID (e.g. EMP-101)',
  })
  @IsNotEmpty({ message: 'Email or Employee ID is required' })
  @IsString()
  identifier: string;

  @ApiPropertyOptional({
    example: 'Locked out after forgetting credentials',
    description: 'Optional note or reason provided by requester',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ResetPasswordDto {
  @ApiPropertyOptional({
    example: 'a1b2c3d4e5f6...',
    description: 'Single-use cryptographic reset authorization token issued upon phrase verification',
  })
  @IsOptional()
  @IsString()
  resetAuthToken?: string;

  @ApiPropertyOptional({
    example: 'CPTL-7482-XK91',
    description: 'Passphrase or single-use reset token (legacy/fallback)',
  })
  @IsOptional()
  @IsString()
  token?: string;

  @ApiPropertyOptional({
    example: 'CPTL-7482-XK91',
    description: 'Passphrase alias for single-use reset token',
  })
  @IsOptional()
  @IsString()
  passphrase?: string;

  @ApiProperty({
    example: 'NewSecurePassword2026!',
    description: 'New password',
  })
  @IsNotEmpty({ message: 'New password is required' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  newPassword: string;

  @ApiPropertyOptional({
    example: 'employee@capitalre.com',
    description: 'Optional corporate email or employee ID',
  })
  @IsOptional()
  @IsString()
  identifier?: string;
}

export class VerifyPassphraseDto {
  @ApiProperty({
    example: 'EMP-101',
    description: 'Corporate email or employee ID of the account undergoing recovery',
  })
  @IsNotEmpty({ message: 'Employee identifier is required' })
  @IsString()
  identifier: string;

  @ApiProperty({
    example: 'CPTL-7482-XK91',
    description: 'Administrator-issued recovery phrase',
  })
  @IsNotEmpty({ message: 'Recovery phrase is required' })
  @IsString()
  passphrase: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    example: 'OldPassword123!',
    description: 'Current password',
  })
  @IsNotEmpty({ message: 'Current password is required' })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    example: 'NewSecurePassword2026!',
    description: 'New password',
  })
  @IsNotEmpty({ message: 'New password is required' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  newPassword: string;
}

export class AdminResetPasswordDto {
  @ApiPropertyOptional({
    example: true,
    description: 'Require user to establish new password before continuing',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  forcePasswordChange?: boolean;

  @ApiPropertyOptional({
    example: 'CPTL-8842-WK',
    description: 'Custom passphrase to issue. If omitted, a secure passphrase will be auto-generated.',
  })
  @IsOptional()
  @IsString()
  passphrase?: string;
}

export class ApproveResetRequestDto {
  @ApiPropertyOptional({
    example: 'CPTL-8842-WK91',
    description: 'Custom recovery phrase (format: CPTL-XXXX-XXXX). If omitted, a cryptographically secure random phrase is generated.',
  })
  @IsOptional()
  @IsString()
  passphrase?: string;

  @ApiPropertyOptional({
    example: 15,
    description: 'Passphrase validity duration in minutes (default: 15)',
    default: 15,
  })
  @IsOptional()
  expiresInMinutes?: number;

  @ApiPropertyOptional({
    example: 'Verified with department manager',
    description: 'Optional administrator note',
  })
  @IsOptional()
  @IsString()
  adminNotes?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Force user to change password upon next login',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  forcePasswordChange?: boolean;
}

export class ResendPassphraseDto {
  @ApiPropertyOptional({
    example: 15,
    description: 'Passphrase validity duration in minutes (default: 15)',
    default: 15,
  })
  @IsOptional()
  expiresInMinutes?: number;

  @ApiPropertyOptional({
    example: 'Resending due to delivery timeout or user request',
    description: 'Optional administrator note',
  })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}

export class RejectResetRequestDto {
  @ApiPropertyOptional({
    example: 'Identity could not be verified by HR',
    description: 'Reason for rejection',
  })
  @IsOptional()
  @IsString()
  rejectReason?: string;
}

