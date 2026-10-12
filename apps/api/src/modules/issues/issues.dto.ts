import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IssueSeverity, IssueStatus } from '@prisma/client';

export class CreateIssueDto {
  @ApiProperty({ example: 'vehicle-uuid' })
  @IsNotEmpty()
  @IsString()
  vehicleId: string;

  @ApiProperty({ example: 'Brake fluid level low and warning light illuminated' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional({ enum: IssueSeverity, default: IssueSeverity.MEDIUM })
  @IsOptional()
  @IsEnum(IssueSeverity)
  severity?: IssueSeverity;

  @ApiPropertyOptional({ example: false, description: 'Whether to place vehicle under MAINTENANCE status immediately' })
  @IsOptional()
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
