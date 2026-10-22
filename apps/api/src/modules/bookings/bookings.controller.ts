import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import {
  CreateBookingDto,
  RejectBookingDto,
  CancelBookingDto,
  AssignVehicleDto,
  StartTripDto,
  CompleteTripDto,
  UpdateBookingDayDto,
  DeclineAssignmentDto,
  ReportDelayDto,
  CheckDuplicateDto,
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
  @ApiOperation({ summary: 'Public secure verification endpoint for QR code validation by reference or token' })
  verifyBooking(@Param('reference') reference: string) {
    return this.bookingsService.verifyBooking(reference);
  }

  @Public()
  @Get('verify-token/:token')
  @ApiOperation({ summary: 'Public secure QR token verification' })
  verifyByToken(@Param('token') token: string) {
    return this.bookingsService.verifyBooking(token);
  }

  @Post('check-duplicate')
  @ApiOperation({ summary: 'Detect potentially duplicated requests before submission' })
  checkDuplicate(@CurrentUser() user: any, @Body() dto: CheckDuplicateDto) {
    return this.bookingsService.checkDuplicate(user.id, dto.destination, dto.departureAt);
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
  cancel(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: CancelBookingDto) {
    return this.bookingsService.cancel(id, user, dto);
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

  @Post(':id/confirm-assignment')
  @Roles(UserRole.DRIVER, UserRole.LOGISTICS_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Driver confirms acceptance of assigned mission' })
  confirmAssignment(@Param('id') id: string, @CurrentUser() user: any) {
    return this.bookingsService.confirmAssignment(id, user);
  }

  @Post(':id/decline-assignment')
  @Roles(UserRole.DRIVER, UserRole.LOGISTICS_ADMIN, UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Driver declines assigned mission with required reason' })
  declineAssignment(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: DeclineAssignmentDto) {
    return this.bookingsService.declineAssignment(id, user, dto);
  }

  @Post(':id/start')
  @Roles(UserRole.LOGISTICS_ADMIN, UserRole.SYSTEM_ADMIN, UserRole.DRIVER)
  @ApiOperation({ summary: 'Record vehicle departure and begin trip execution' })
  startTrip(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: StartTripDto) {
    return this.bookingsService.startTrip(id, user, dto);
  }

  @Post(':id/mark-arrival')
  @Roles(UserRole.LOGISTICS_ADMIN, UserRole.SYSTEM_ADMIN, UserRole.DRIVER)
  @ApiOperation({ summary: 'Mark arrival at mission destination' })
  markArrival(@Param('id') id: string, @CurrentUser() user: any) {
    return this.bookingsService.markArrival(id, user);
  }

  @Post(':id/report-delay')
  @Roles(UserRole.LOGISTICS_ADMIN, UserRole.SYSTEM_ADMIN, UserRole.DRIVER)
  @ApiOperation({ summary: 'Report trip delay with explanation' })
  reportDelay(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: ReportDelayDto) {
    return this.bookingsService.reportDelay(id, user, dto);
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
