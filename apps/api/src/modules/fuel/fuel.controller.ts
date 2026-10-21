import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FuelService } from './fuel.service';
import { CreateFuelRecordDto, QueryFuelStatsDto } from './fuel.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Fuel & Operational Costs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fuel')
export class FuelController {
  constructor(private readonly fuelService: FuelService) {}

  @Get()
  @Roles(UserRole.LOGISTICS_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'List fleet fuel records with vehicle, driver, and date filters' })
  @ApiQuery({ name: 'vehicleId', required: false })
  @ApiQuery({ name: 'driverId', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  findAll(
    @Query('vehicleId') vehicleId?: string,
    @Query('driverId') driverId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.fuelService.findAll({ vehicleId, driverId, dateFrom, dateTo });
  }

  @Get('stats')
  @Roles(UserRole.LOGISTICS_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Calculate fuel expenditure, cost per km, and monthly consumption trends' })
  getStats(@Query() query: QueryFuelStatsDto) {
    return this.fuelService.getStats(query);
  }

  @Post()
  @Roles(UserRole.LOGISTICS_ADMIN, UserRole.SYSTEM_ADMIN, UserRole.DRIVER)
  @ApiOperation({ summary: 'Log a new fuel purchase receipt with anomaly verification' })
  create(@Body() dto: CreateFuelRecordDto, @Request() req: any) {
    // If logged by a driver, default driverId to current user if not provided
    if (!dto.driverId && req.user.role === UserRole.DRIVER) {
      dto.driverId = req.user.id;
    }
    return this.fuelService.create(dto, req.user.id);
  }
}
