import { Controller, Get, Patch, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSystemSettingsDto, PurgeOperationsDataDto } from './settings.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all effective system settings and operational policies' })
  @ApiResponse({ status: 200, description: 'Settings retrieved' })
  async getSettings() {
    return this.settingsService.getAllSettings();
  }

  @Patch()
  @Roles(UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Update system security, booking, and assignment settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  async updateSettings(@CurrentUser() admin: any, @Body() dto: UpdateSystemSettingsDto) {
    return this.settingsService.updateSettings(dto, admin.id || admin.sub);
  }

  @Post('danger/purge-operations')
  @Roles(UserRole.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Permanently purge transport operations data with re-authentication' })
  @ApiResponse({ status: 200, description: 'Operations data purged successfully' })
  async purgeOperationsData(@CurrentUser() admin: any, @Body() dto: PurgeOperationsDataDto) {
    return this.settingsService.purgeOperationsData(dto, admin.id || admin.sub);
  }
}
