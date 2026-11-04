// CONTROLLER: Vehicle defect reports (OPEN / IN_REVIEW / RESOLVED).
import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IssuesService } from './issues.service';
import { CreateIssueDto, UpdateIssueDto } from './issues.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, IssueStatus } from '@prisma/client';

@ApiTags('Vehicle Issues & Maintenance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vehicle-issues')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Get()
  @ApiOperation({ summary: 'List reported vehicle issues' })
  @ApiQuery({ name: 'status', enum: IssueStatus, required: false })
  @ApiQuery({ name: 'vehicleId', required: false })
  findAll(@Query('status') status?: IssueStatus, @Query('vehicleId') vehicleId?: string) {
    return this.issuesService.findAll({ status, vehicleId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get issue details by ID' })
  findOne(@Param('id') id: string) {
    return this.issuesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Report a new vehicle defect or problem' })
  create(@CurrentUser() user: any, @Body() dto: CreateIssueDto) {
    return this.issuesService.create(user, dto);
  }

  @Patch(':id')
  @Roles(UserRole.LOGISTICS_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Update issue status or record resolution' })
  update(@Param('id') id: string, @Body() dto: UpdateIssueDto) {
    return this.issuesService.update(id, dto);
  }
}
