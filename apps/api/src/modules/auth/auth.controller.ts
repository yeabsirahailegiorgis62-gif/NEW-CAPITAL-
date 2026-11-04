// CONTROLLER: Handles incoming HTTP requests for login, password reset, and profile.
import { Controller, Post, Get, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  AdminResetPasswordDto,
  ApproveResetRequestDto,
  ResendPassphraseDto,
  RejectResetRequestDto,
} from './auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  // DEPENDENCY INJECTION: NestJS provides AuthService automatically.
  constructor(private readonly authService: AuthService) {}

  // POST: Authenticates with email or employee ID and returns a JWT + user profile.
  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user with corporate email or employee ID' })
  @ApiResponse({ status: 200, description: 'Authentication successful with JWT token and user profile' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or inactive account' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // POST: Creates a PasswordResetRequest for SYSTEM_ADMIN review (no token is emailed yet).
  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset passphrase from administrator' })
  @ApiResponse({ status: 200, description: 'Reset request received and dispatched to administrator' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  // POST: Completes password reset using the admin-issued passphrase.
  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerate account password using administrator-issued passphrase' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // POST: Authenticated user changes their own password.
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password for currently authenticated user' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  async changePassword(@CurrentUser() user: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.id || user.sub, dto);
  }

  // GET: SYSTEM_ADMIN lists password-reset requests.
  @Get('admin/reset-requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all password reset requests (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of password reset requests' })
  async getResetRequests(@Query('status') status?: string) {
    return this.authService.getResetRequests(status);
  }

  @Post('admin/reset-requests/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve password reset request and send passphrase to user inbox' })
  @ApiResponse({ status: 200, description: 'Passphrase generated and delivered to user inbox' })
  async approveResetRequest(
    @Param('id') id: string,
    @CurrentUser() admin: any,
    @Body() dto: ApproveResetRequestDto,
  ) {
    return this.authService.approveResetRequest(
      admin.id || admin.sub,
      admin.name || 'System Administrator',
      id,
      dto,
    );
  }

  @Post('admin/reset-requests/:id/resend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend password reset passphrase to user email' })
  @ApiResponse({ status: 200, description: 'Passphrase regenerated and resent to user email' })
  async resendResetPassphrase(
    @Param('id') id: string,
    @CurrentUser() admin: any,
    @Body() dto: ResendPassphraseDto,
  ) {
    return this.authService.resendResetPassphrase(
      admin.id || admin.sub,
      admin.name || 'System Administrator',
      id,
      dto,
    );
  }

  @Post('admin/reset-requests/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject password reset request' })
  @ApiResponse({ status: 200, description: 'Reset request rejected' })
  async rejectResetRequest(
    @Param('id') id: string,
    @CurrentUser() admin: any,
    @Body() dto: RejectResetRequestDto,
  ) {
    return this.authService.rejectResetRequest(
      admin.id || admin.sub,
      admin.name || 'System Administrator',
      id,
      dto,
    );
  }

  @Post('admin/reset-password/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Administrator-initiated password reset' })
  @ApiResponse({ status: 200, description: 'Password reset initiated by administrator' })
  async adminResetPassword(
    @Param('userId') targetUserId: string,
    @CurrentUser() admin: any,
    @Body() dto: AdminResetPasswordDto,
  ) {
    return this.authService.adminInitiatePasswordReset(
      admin.id || admin.sub,
      admin.name || 'System Administrator',
      targetUserId,
      dto,
    );
  }

  // GET: Returns the JWT-authenticated user (from JwtStrategy.validate).
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get profile details of the authenticated user' })
  @ApiResponse({ status: 200, description: 'Profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser() user: any) {
    return user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign out user session' })
  async logout() {
    return { message: 'Logged out successfully' };
  }
}

