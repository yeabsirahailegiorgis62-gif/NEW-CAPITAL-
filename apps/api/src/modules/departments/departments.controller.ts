import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
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
  @ApiOperation({ summary: 'List company departments with user counts' })
  findAll() {
    return this.departmentsService.findAll();
  }

  @Post()
  @Roles(UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Create a new department' })
  create(@Body() body: { name: string; code?: string; description?: string }) {
    return this.departmentsService.create(body);
  }

  @Patch(':id')
  @Roles(UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Update an existing department' })
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; code?: string; description?: string; isActive?: boolean }
  ) {
    return this.departmentsService.update(id, body);
  }

  @Delete(':id')
  @Roles(UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Delete a department (safe delete with active user check)' })
  remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }
}
