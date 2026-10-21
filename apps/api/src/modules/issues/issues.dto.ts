import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsBoolean, IsNumber } from 'class-validator';
import { IssueSeverity, IssueStatus } from '@prisma/client';

export class CreateIssueDto {
  @ApiProperty({ example: 'vehicle-uuid' })
  @IsNotEmpty()
  @IsString()
  vehicleId: string;

  @ApiPropertyOptional({ example: 'MECHANICAL', default: 'MECHANICAL' })
  @IsOptional()
  @IsString()
  category?: string; // MECHANICAL, TIRES, ACCIDENT, ELECTRICAL, FUEL, WARNING_LIGHTS, EQUIPMENT, SAFETY, OTHER

  @ApiProperty({ example: 'Brake fluid level low and ABS warning light illuminated' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional({ enum: IssueSeverity, default: IssueSeverity.MEDIUM })
  @IsOptional()
  @IsEnum(IssueSeverity)
  severity?: IssueSeverity;

  @ApiPropertyOptional({ example: 21500 })
  @IsOptional()
  @IsNumber()
  odometer?: number;

  @ApiPropertyOptional({ example: true, description: 'Immediate safety concern halts vehicle assignment' })
  @IsOptional()
  @IsBoolean()
  immediateSafetyConcern?: boolean;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341' })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({ example: false, description: 'Whether to place vehicle under MAINTENANCE status immediately' })
  @IsOptional()
  @IsBoolean()
  setMaintenanceStatus?: boolean;
}

export class UpdateIssueDto {
  @ApiPropertyOptional({ enum: IssueStatus })
  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;

  @ApiPropertyOptional({ example: 'Repaired by central workshop technicians' })
  @IsOptional()
  @IsString()
  resolutionNotes?: string;
}
