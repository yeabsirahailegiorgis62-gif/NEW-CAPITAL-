import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';

export class CreateMaintenanceDto {
  @ApiProperty({ example: '3e3d5eba-...' })
  @IsNotEmpty()
  @IsString()
  vehicleId: string;

  @ApiPropertyOptional({ example: 'PREVENTIVE', default: 'PREVENTIVE' })
  @IsOptional()
  @IsString()
  category?: string; // PREVENTIVE, SCHEDULED, REPAIR, INSPECTION, TIRE, OIL_CHANGE, BRAKES, OTHER

  @ApiPropertyOptional({ example: 'SCHEDULED', default: 'SCHEDULED' })
  @IsOptional()
  @IsString()
  status?: string; // REPORTED, SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reportedProblem?: string;

  @ApiProperty({ example: '10,000 km Scheduled Service: Oil filter, engine oil, brake pad inspection' })
  @IsNotEmpty()
  @IsString()
  serviceDescription: string;

  @ApiProperty({ example: '2026-10-25T08:00:00.000Z' })
  @IsNotEmpty()
  @IsDateString()
  serviceDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  completedDate?: string;

  @ApiPropertyOptional({ example: 25400 })
  @IsOptional()
  @IsNumber()
  odometer?: number;

  @ApiPropertyOptional({ example: 'Toyota MOENCO Authorized Workshop, Addis Ababa' })
  @IsOptional()
  @IsString()
  serviceProvider?: string;

  @ApiPropertyOptional({ example: 4500 })
  @IsOptional()
  @IsNumber()
  estimatedCost?: number;

  @ApiPropertyOptional({ example: 4300 })
  @IsOptional()
  @IsNumber()
  actualCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  nextServiceDate?: string;

  @ApiPropertyOptional({ example: 35000 })
  @IsOptional()
  @IsNumber()
  nextServiceOdometer?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  documentUrl?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  transitionVehicleToMaintenance?: boolean;
}

export class UpdateMaintenanceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reportedProblem?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serviceDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  serviceDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  completedDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  odometer?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serviceProvider?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  estimatedCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  actualCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  nextServiceDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  nextServiceOdometer?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  documentUrl?: string;
}
