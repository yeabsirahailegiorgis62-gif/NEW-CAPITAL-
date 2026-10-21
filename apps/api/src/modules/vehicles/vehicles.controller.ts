import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto, UpdateVehicleDto } from './vehicles.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, VehicleCategory, VehicleOperationalStatus } from '@prisma/client';

@ApiTags('Vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @ApiOperation({ summary: 'List all vehicles with optional filters' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', enum: VehicleCategory, required: false })
  @ApiQuery({ name: 'status', enum: VehicleOperationalStatus, required: false })
  findAll(
    @Query('search') search?: string,
    @Query('category') category?: VehicleCategory,
    @Query('status') status?: VehicleOperationalStatus,
  ) {
    return this.vehiclesService.findAll({ search, category, status });
  }

  @Get('availability')
  @ApiOperation({ summary: 'Calculate fleet availability for a specific time interval [departureAt, expectedReturnAt)' })
  @ApiQuery({ name: 'departureAt', required: true, example: '2026-10-14T08:00:00Z' })
  @ApiQuery({ name: 'expectedReturnAt', required: true, example: '2026-10-14T17:00:00Z' })
  @ApiQuery({ name: 'minCapacity', required: false, type: Number })
  @ApiQuery({ name: 'category', enum: VehicleCategory, required: false })
  getAvailability(
    @Query('departureAt') departureAtStr: string,
    @Query('expectedReturnAt') expectedReturnAtStr: string,
    @Query('minCapacity') minCapacity?: string,
    @Query('category') category?: VehicleCategory,
  ) {
    const departureAt = new Date(departureAtStr);
    const expectedReturnAt = new Date(expectedReturnAtStr);
    const capacity = minCapacity ? parseInt(minCapacity, 10) : undefined;

    return this.vehiclesService.getAvailability(departureAt, expectedReturnAt, capacity, category);
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Intelligent vehicle recommendation engine with matching scores & explanation' })
  @ApiQuery({ name: 'departureAt', required: true })
  @ApiQuery({ name: 'expectedReturnAt', required: true })
  @ApiQuery({ name: 'passengerCount', required: true, type: Number })
  @ApiQuery({ name: 'category', enum: VehicleCategory, required: false })
  @ApiQuery({ name: 'preferredVehicleId', required: false })
  getRecommendations(
    @Query('departureAt') departureAtStr: string,
    @Query('expectedReturnAt') expectedReturnAtStr: string,
    @Query('passengerCount') passengerCountStr: string,
    @Query('category') category?: VehicleCategory,
    @Query('preferredVehicleId') preferredVehicleId?: string,
  ) {
    const departureAt = new Date(departureAtStr);
    const expectedReturnAt = new Date(expectedReturnAtStr);
    const passengerCount = parseInt(passengerCountStr || '1', 10);

    return this.vehiclesService.getRecommendations({
      departureAt,
      expectedReturnAt,
      passengerCount,
      category,
      preferredVehicleId,
    });
  }

  @Get('drivers/recommendations')
  @ApiOperation({ summary: 'Intelligent driver recommendation engine with availability & qualification check' })
  @ApiQuery({ name: 'departureAt', required: true })
  @ApiQuery({ name: 'expectedReturnAt', required: true })
  getDriverRecommendations(
    @Query('departureAt') departureAtStr: string,
    @Query('expectedReturnAt') expectedReturnAtStr: string,
  ) {
    const departureAt = new Date(departureAtStr);
    const expectedReturnAt = new Date(expectedReturnAtStr);

    return this.vehiclesService.getDriverRecommendations(departureAt, expectedReturnAt);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vehicle by ID with issues and assignment history' })
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Post()
  @Roles(UserRole.LOGISTICS_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Create new vehicle in fleet' })
  create(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.LOGISTICS_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Update vehicle information or operational status' })
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, dto);
  }
}
