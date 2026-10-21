import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'employee@capitalre.com',
    description: 'Corporate email or assigned employee ID (e.g. EMP-101)',
  })
  @IsNotEmpty({ message: 'Email or Employee ID is required' })
  @IsString()
  identifier: string;

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
}

export class ResetPasswordDto {
  @ApiProperty({
    example: 'd9b1c7f4-...',
    description: 'Single-use time-limited reset token',
  })
  @IsNotEmpty({ message: 'Reset token is required' })
  @IsString()
  token: string;

  @ApiProperty({
    example: 'NewSecurePassword2026!',
    description: 'New password',
  })
  @IsNotEmpty({ message: 'New password is required' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  newPassword: string;
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
}
