// CONTROLLER: Read-only audit trail of booking, user, and assignment actions.
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SYSTEM_ADMIN, UserRole.LOGISTICS_ADMIN)
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'View immutable system audit logs' })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'entityId', required: false })
  findAll(@Query('entityType') entityType?: string, @Query('entityId') entityId?: string) {
    return this.auditService.findAll({ entityType, entityId });
  }
}
