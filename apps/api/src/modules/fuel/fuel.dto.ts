import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsDateString, Min } from 'class-validator';

export class CreateFuelRecordDto {
  @ApiProperty({ example: 'vehicle-uuid-123' })
  @IsNotEmpty()
  @IsString()
  vehicleId: string;

  @ApiPropertyOptional({ example: 'driver-uuid-456' })
  @IsOptional()
  @IsString()
  driverId?: string;

  @ApiPropertyOptional({ example: '2026-10-21T08:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({ example: 18450 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  odometer: number;

  @ApiProperty({ example: 55 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.1)
  fuelQuantity: number; // Liters

  @ApiProperty({ example: 98.5 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.1)
  unitPrice: number; // Birr per Liter

  @ApiPropertyOptional({ example: 5417.5 })
  @IsOptional()
  @IsNumber()
  totalCost?: number; // Birr (auto-computed if omitted)

  @ApiPropertyOptional({ example: 'TotalEnergies Bole Road Station, Addis Ababa' })
  @IsOptional()
  @IsString()
  fuelStation?: string;

  @ApiPropertyOptional({ example: 'REC-2026-90412' })
  @IsOptional()
  @IsString()
  receiptReference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class QueryFuelStatsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vehicleId?: string;
}
