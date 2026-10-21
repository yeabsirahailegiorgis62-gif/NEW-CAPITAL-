import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceDto, UpdateMaintenanceDto } from './maintenance.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Maintenance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get()
  @Roles(UserRole.LOGISTICS_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'List maintenance records with optional vehicle/status/category filters' })
  @ApiQuery({ name: 'vehicleId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'category', required: false })
  findAll(
    @Query('vehicleId') vehicleId?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
  ) {
    return this.maintenanceService.findAll({ vehicleId, status, category });
  }

  @Get('overview')
  @Roles(UserRole.LOGISTICS_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Get preventive maintenance overview, due vehicles, and upcoming expirations' })
  getOverview() {
    return this.maintenanceService.getOverview();
  }

  @Get(':id')
  @Roles(UserRole.LOGISTICS_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Get single maintenance record details' })
  findOne(@Param('id') id: string) {
    return this.maintenanceService.findOne(id);
  }

  @Post()
  @Roles(UserRole.LOGISTICS_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Schedule or log vehicle maintenance service' })
  create(@Body() dto: CreateMaintenanceDto, @Request() req: any) {
    return this.maintenanceService.create(dto, req.user.id);
  }

  @Patch(':id')
  @Roles(UserRole.LOGISTICS_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Update maintenance record or mark as completed' })
  update(@Param('id') id: string, @Body() dto: UpdateMaintenanceDto, @Request() req: any) {
    return this.maintenanceService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @Roles(UserRole.LOGISTICS_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Remove or cancel maintenance record' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.maintenanceService.remove(id, req.user.id);
  }
}
