import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 'Bole Boulevard Project Site No. 4' })
  @IsNotEmpty({ message: 'Destination is required' })
  @IsString()
  destination: string;

  @ApiProperty({ example: 'Soil bearing test and structural foundation inspection' })
  @IsNotEmpty({ message: 'Trip purpose is required' })
  @IsString()
  purpose: string;

  @ApiProperty({ example: '2026-10-14T08:30:00Z', description: 'Departure date/time in UTC' })
  @IsNotEmpty({ message: 'Departure time is required' })
  @IsDateString()
  departureAt: string;

  @ApiProperty({ example: '2026-10-14T17:00:00Z', description: 'Expected return date/time in UTC' })
  @IsNotEmpty({ message: 'Expected return time is required' })
  @IsDateString()
  expectedReturnAt: string;

  @ApiProperty({ example: 3, description: 'Number of passengers' })
  @IsInt()
  @Min(1)
  passengerCount: number;

  @ApiPropertyOptional({ example: 'Optional preferred vehicle ID' })
  @IsOptional()
  @IsString()
  preferredVehicleId?: string;

  @ApiProperty({ example: true, default: false })
  @IsBoolean()
  requiresDriver: boolean;

  @ApiPropertyOptional({ example: 'Special site passes required at checkpoint' })
  @IsOptional()
  @IsString()
  additionalNotes?: string;
}

export class RejectBookingDto {
  @ApiProperty({ example: 'All pickups reserved for executive site inspection during requested window' })
  @IsNotEmpty({ message: 'Rejection reason is required' })
  @IsString()
  rejectionReason: string;
}

export class AssignVehicleDto {
  @ApiProperty({ example: 'vehicle-uuid-here' })
  @IsNotEmpty({ message: 'Vehicle ID is required' })
  @IsString()
  vehicleId: string;

  @ApiPropertyOptional({ example: 'Abebe Molla' })
  @IsOptional()
  @IsString()
  driverName?: string;

  @ApiPropertyOptional({ example: '+251 91 123 4567' })
  @IsOptional()
  @IsString()
  driverPhone?: string;

  @ApiPropertyOptional({ example: 'Assigned for regional project survey' })
  @IsOptional()
  @IsString()
  assignmentNotes?: string;
}

export class StartTripDto {
  @ApiPropertyOptional({ example: '2026-10-14T08:35:00Z' })
  @IsOptional()
  @IsDateString()
  actualDepartureAt?: string;

  @ApiPropertyOptional({ example: 45200 })
  @IsOptional()
  @IsInt()
  @Min(0)
  startOdometer?: number;
}

export class CompleteTripDto {
  @ApiPropertyOptional({ example: '2026-10-14T16:45:00Z' })
  @IsOptional()
  @IsDateString()
  actualReturnAt?: string;

  @ApiPropertyOptional({ example: 45285 })
  @IsOptional()
  @IsInt()
  @Min(0)
  endOdometer?: number;

  @ApiPropertyOptional({ example: 'Trip completed safely with zero incidents' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'Slight squeak in passenger side door hinge' })
  @IsOptional()
  @IsString()
  reportedProblem?: string;
}
