// CONTROLLER: Staff account CRUD plus authenticated self-profile updates.
import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UpdateProfileDto } from './users.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  // DEPENDENCY INJECTION: UsersService hashes passwords and never returns passwordHash.
  constructor(private readonly usersService: UsersService) {}

  @Get('profile/me')
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  getOwnProfile(@CurrentUser() user: any) {
    return this.usersService.findOne(user.id || user.sub);
  }

  @Patch('profile/me')
  @ApiOperation({ summary: 'Update profile of currently authenticated user' })
  updateOwnProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id || user.sub, dto);
  }

  @Get()
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.LOGISTICS_ADMIN)
  @ApiOperation({ summary: 'List all staff users' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles(UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Create new user account' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Update user account or status' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }
}
