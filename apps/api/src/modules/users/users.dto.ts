import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'Yared Tesfaye' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'yared@capitalre.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'EMP-105' })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiProperty({ example: 'CapitalFleet2026!' })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: UserRole, default: UserRole.EMPLOYEE })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  isActive?: boolean;
}
