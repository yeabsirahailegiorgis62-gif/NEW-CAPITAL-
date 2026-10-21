import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import {
  CreateBookingDto,
  RejectBookingDto,
  AssignVehicleDto,
  StartTripDto,
  CompleteTripDto,
  UpdateBookingDayDto,
} from './bookings.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, BookingStatus } from '@prisma/client';

@ApiTags('Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Public()
  @Get('verify/:reference')
  @ApiOperation({ summary: 'Public secure verification endpoint for QR code validation' })
  verifyBooking(@Param('reference') reference: string) {
    return this.bookingsService.verifyBooking(reference);
  }

  @Post()
  @ApiOperation({ summary: 'Submit a new vehicle booking request' })
  create(@CurrentUser() user: any, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List bookings (scoped to user role with optional filters)' })
  @ApiQuery({ name: 'status', enum: BookingStatus, required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  findAll(
    @CurrentUser() user: any,
    @Query('status') status?: BookingStatus,
    @Query('search') search?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.bookingsService.findAll(user, { status, search, from, to });
  }

  @Get('stats')
  @Roles(UserRole.LOGISTICS_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Get live operational logistics dashboard metrics' })
  getDashboardStats() {
    return this.bookingsService.getDashboardStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking details by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.bookingsService.findOne(id, user);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel booking request' })
  cancel(@Param('id') id: string, @CurrentUser() user: any, @Body('reason') reason?: string) {
    return this.bookingsService.cancel(id, user, reason);
  }

  @Post(':id/approve')
  @Roles(UserRole.LOGISTICS_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Approve a pending booking request' })
  approve(@Param('id') id: string, @CurrentUser() user: any) {
    return this.bookingsService.approve(id, user);
  }

  @Post(':id/reject')
  @Roles(UserRole.LOGISTICS_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Reject a pending booking request with reason' })
  reject(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: RejectBookingDto) {
    return this.bookingsService.reject(id, user, dto);
  }

  @Post(':id/assign')
  @Roles(UserRole.LOGISTICS_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Assign (or reassign) a vehicle to an approved booking' })
  assignVehicle(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: AssignVehicleDto) {
    return this.bookingsService.assignVehicle(id, user, dto);
  }

  @Post(':id/start')
  @Roles(UserRole.LOGISTICS_ADMIN, UserRole.SYSTEM_ADMIN, UserRole.DRIVER)
  @ApiOperation({ summary: 'Record vehicle departure and begin trip execution' })
  startTrip(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: StartTripDto) {
    return this.bookingsService.startTrip(id, user, dto);
  }

  @Patch('days/:dayId')
  @Roles(UserRole.LOGISTICS_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Update status or assignment of a specific day in a weekly request' })
  updateBookingDay(
    @Param('dayId') dayId: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateBookingDayDto,
  ) {
    return this.bookingsService.updateBookingDay(dayId, user, dto);
  }

  @Post(':id/complete')
  @Roles(UserRole.LOGISTICS_ADMIN, UserRole.SYSTEM_ADMIN, UserRole.DRIVER)
  @ApiOperation({ summary: 'Record vehicle return and finalize completed trip' })
  completeTrip(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: CompleteTripDto) {
    return this.bookingsService.completeTrip(id, user, dto);
  }
}
