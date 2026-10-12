import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @ApiOperation({ summary: 'List company departments' })
  findAll() {
    return this.departmentsService.findAll();
  }

  @Post()
  @Roles(UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Create a new department' })
  create(@Body() body: { name: string; description?: string }) {
    return this.departmentsService.create(body.name, body.description);
  }
}
