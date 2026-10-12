import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { VehicleCategory, VehicleOperationalStatus } from '@prisma/client';

export class CreateVehicleDto {
  @ApiProperty({ example: 'Land Cruiser Prado TX' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Toyota' })
  @IsNotEmpty()
  @IsString()
  make: string;

  @ApiProperty({ example: 'Prado 2022' })
  @IsNotEmpty()
  @IsString()
  model: string;

  @ApiProperty({ example: '3-A12490' })
  @IsNotEmpty()
  @IsString()
  registrationNumber: string;

  @ApiProperty({ enum: VehicleCategory, default: VehicleCategory.SUV })
  @IsEnum(VehicleCategory)
  category: VehicleCategory;

  @ApiProperty({ example: 7 })
  @IsInt()
  @Min(1)
  passengerCapacity: number;

  @ApiPropertyOptional({ enum: VehicleOperationalStatus, default: VehicleOperationalStatus.ACTIVE })
  @IsOptional()
  @IsEnum(VehicleOperationalStatus)
  operationalStatus?: VehicleOperationalStatus;

  @ApiPropertyOptional({ example: 'Executive 4WD suited for regional project sites' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Fuel card allocated. Air conditioning operational.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateVehicleDto {
  @ApiPropertyOptional({ example: '3-A12490' })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  make?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ enum: VehicleCategory })
  @IsOptional()
  @IsEnum(VehicleCategory)
  category?: VehicleCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  passengerCapacity?: number;

  @ApiPropertyOptional({ enum: VehicleOperationalStatus })
  @IsOptional()
  @IsEnum(VehicleOperationalStatus)
  operationalStatus?: VehicleOperationalStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
