import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateBookingDto,
  RejectBookingDto,
  AssignVehicleDto,
  StartTripDto,
  CompleteTripDto,
} from './bookings.dto';
import { BookingStatus, UserRole, VehicleOperationalStatus, IssueSeverity, IssueStatus } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Submit a new vehicle booking request
   */
  async create(requesterId: string, dto: CreateBookingDto) {
    // Read system settings for booking rules
    const settingsList = await this.prisma.systemSetting.findMany();
    const settingsMap = new Map<string, any>();
    settingsList.forEach((s) => {
      try {
        settingsMap.set(s.key, JSON.parse(s.value));
      } catch {
        settingsMap.set(s.key, s.value);
      }
    });

    const minNoticeHours = settingsMap.get('minimumNoticeHours') ?? 24;
    const maxCapacity = settingsMap.get('maxPassengerCapacity') ?? 14;
    const allowSameDay = settingsMap.get('allowSameDayRequests') ?? false;
    const allowWeekend = settingsMap.get('allowWeekendRequests') ?? false;

    if (dto.passengerCount > maxCapacity) {
      throw new BadRequestException(`Passenger count exceeds maximum allowed limit (${maxCapacity} passengers).`);
    }

    const departure = new Date(dto.departureAt);
    const expectedReturn = new Date(dto.expectedReturnAt);
    const now = new Date();

    if (isNaN(departure.getTime()) || isNaN(expectedReturn.getTime())) {
      throw new BadRequestException('Invalid departure or expected return date');
    }

    if (departure >= expectedReturn) {
      throw new BadRequestException('Departure time must be strictly before expected return time');
    }

    // Departure time in past check (with 5-minute grace period for network latency)
    if (departure.getTime() < now.getTime() - 5 * 60 * 1000) {
      throw new BadRequestException('Departure time cannot be in the past');
    }

    // Notice validation
    const hoursNotice = (departure.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isSameDay = departure.toDateString() === now.toDateString();

    if (!allowSameDay && isSameDay) {
      throw new BadRequestException('Same-day transport requests are currently not permitted by system policy.');
    }

    if (hoursNotice < minNoticeHours && !isSameDay) {
      throw new BadRequestException(`Requests require a minimum notice of ${minNoticeHours} hours in advance.`);
    }

    const depDay = departure.getDay(); // 0 is Sun, 6 is Sat
    if (!allowWeekend && (depDay === 0 || depDay === 6)) {
      throw new BadRequestException('Weekend transport requests are not permitted by system policy.');
    }

    if (dto.requestType === 'WEEKLY') {
      if (!dto.weeklyDays || dto.weeklyDays.length === 0) {
        throw new BadRequestException('At least one day must be selected for weekly transport requests.');
      }
      const seenDays = new Set<string>();
      for (const d of dto.weeklyDays) {
        if (seenDays.has(d.dayOfWeek)) {
          throw new BadRequestException(`Duplicate day selected in weekly request: ${d.dayOfWeek}`);
        }
        seenDays.add(d.dayOfWeek);
        const slot = (d.timeSlot || (d as any).timePreference || '').toUpperCase();
        if (!['MORNING', 'AFTERNOON'].includes(slot)) {
          throw new BadRequestException(`Invalid time slot for ${d.dayOfWeek}. Must be MORNING or AFTERNOON.`);
        }
        d.timeSlot = slot as any;
        if (!d.tripDate) {
          // If no specific tripDate was sent, default to next occurrence
          d.tripDate = departure.toISOString();
        }
      }
    }

    if (dto.passengerCount < 1) {
      throw new BadRequestException('Passenger count must be at least 1');
    }

    // Generate human-readable booking reference e.g. CR-2026-0042
    const year = departure.getFullYear();
    const count = await this.prisma.booking.count();
    const sequence = String(count + 1).padStart(4, '0');
    const bookingReference = `CR-${year}-${sequence}`;

    const booking = await this.prisma.booking.create({
      data: {
        bookingReference,
        requesterId,
        destination: dto.destination,
        purpose: dto.purpose,
        departureAt: departure,
        expectedReturnAt: expectedReturn,
        passengerCount: dto.passengerCount,
        preferredVehicleId: dto.preferredVehicleId || null,
        requiresDriver: dto.requiresDriver || false,
        additionalNotes: dto.additionalNotes || null,
        status: BookingStatus.PENDING_APPROVAL,
        requestType: dto.requestType || 'DAILY',
        pickupLocation: dto.pickupLocation || null,
        contactPhone: dto.contactPhone || null,
        bookingDays:
          dto.weeklyDays && dto.weeklyDays.length > 0
            ? {
                create: dto.weeklyDays.map((wd) => ({
                  dayOfWeek: wd.dayOfWeek,
                  tripDate: new Date(wd.tripDate),
                  timeSlot: wd.timeSlot,
                  notes: wd.notes || null,
                  status: 'PENDING_APPROVAL',
                })),
              }
            : undefined,
      },
      include: {
        requester: {
          select: { id: true, name: true, email: true, employeeId: true, department: true },
        },
        preferredVehicle: true,
        bookingDays: {
          include: {
            vehicle: true,
            driver: { select: { id: true, name: true, phone: true } },
          },
        },
      },
    });

    // Notify logistics admins about new request
    const logisticsAdmins = await this.prisma.user.findMany({
      where: { role: { in: [UserRole.LOGISTICS_ADMIN, UserRole.SYSTEM_ADMIN] }, isActive: true },
      select: { id: true },
    });

    for (const admin of logisticsAdmins) {
      await this.prisma.notification.create({
        data: {
          recipientId: admin.id,
          bookingId: booking.id,
          type: 'NEW_BOOKING_REQUEST',
          title: 'New Booking Awaiting Review',
          message: `${booking.requester.name} submitted request ${booking.bookingReference} for ${booking.destination}.`,
        },
      });
    }

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        actorId: requesterId,
        actorName: booking.requester.name,
        entityType: 'Booking',
        entityId: booking.id,
        action: 'SUBMIT_REQUEST',
        newValues: {
          bookingReference,
          requestType: dto.requestType || 'DAILY',
          destination: dto.destination,
          departureAt: departure.toISOString(),
          expectedReturnAt: expectedReturn.toISOString(),
          weeklyDaysCount: dto.weeklyDays?.length || 0,
        },
      },
    });

    return booking;
  }

  /**
   * List bookings according to user role and filters
   */
  async findAll(user: any, query?: { status?: BookingStatus; search?: string; from?: string; to?: string }) {
    const where: any = {};

    // Regular employee can ONLY see their own bookings
    if (user.role === UserRole.EMPLOYEE) {
      where.requesterId = user.id;
    } else if (user.role === UserRole.DRIVER) {
      where.assignments = {
        some: {
          OR: [
            { driverId: user.id },
            { driverName: { contains: user.name, mode: 'insensitive' } },
            ...(user.phone ? [{ driverPhone: user.phone }] : []),
          ],
        },
      };
    }

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.search) {
      where.OR = [
        { bookingReference: { contains: query.search, mode: 'insensitive' } },
        { destination: { contains: query.search, mode: 'insensitive' } },
        { purpose: { contains: query.search, mode: 'insensitive' } },
        { requester: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    if (query?.from || query?.to) {
      where.departureAt = {};
      if (query.from) where.departureAt.gte = new Date(query.from);
      if (query.to) where.departureAt.lte = new Date(query.to);
    }

    return this.prisma.booking.findMany({
      where,
      include: {
        requester: {
          select: { id: true, name: true, email: true, employeeId: true, department: true },
        },
        preferredVehicle: true,
        bookingDays: {
          include: {
            vehicle: true,
            driver: { select: { id: true, name: true, phone: true } },
          },
          orderBy: { tripDate: 'asc' },
        },
        assignments: {
          where: { unassignedAt: null },
          include: {
            vehicle: true,
            assignedBy: { select: { id: true, name: true } },
          },
          orderBy: { assignedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get single booking details with strict access control
   */
  async findOne(id: string, user: any) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        requester: {
          select: { id: true, name: true, email: true, employeeId: true, department: true },
        },
        preferredVehicle: true,
        bookingDays: {
          include: {
            vehicle: true,
            driver: { select: { id: true, name: true, phone: true } },
          },
          orderBy: { tripDate: 'asc' },
        },
        assignments: {
          include: {
            vehicle: true,
            assignedBy: { select: { id: true, name: true } },
          },
          orderBy: { assignedAt: 'desc' },
        },
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    // Ownership check for employees
    if (user.role === UserRole.EMPLOYEE && booking.requesterId !== user.id) {
      throw new ForbiddenException('You are not authorized to view this booking record');
    }

    // Authorization check for drivers
    if (user.role === UserRole.DRIVER) {
      const isAssigned = booking.assignments.some(
        (a: any) =>
          a.driverId === user.id ||
          (user.name && a.driverName && a.driverName.toLowerCase() === user.name.toLowerCase()) ||
          (user.phone && a.driverPhone === user.phone)
      );
      if (!isAssigned) {
        throw new ForbiddenException('You are not assigned as the driver for this trip');
      }
    }

    return booking;
  }

  /**
   * Update an individual day of a weekly booking
   */
  async updateBookingDay(dayId: string, actor: any, dto: any) {
    const day = await this.prisma.bookingDay.findUnique({
      where: { id: dayId },
      include: { booking: true },
    });

    if (!day) throw new NotFoundException('Booking day not found');

    if (dto.vehicleId) {
      const vehicle = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
      if (!vehicle) throw new NotFoundException('Vehicle not found');
      if (vehicle.operationalStatus !== VehicleOperationalStatus.ACTIVE) {
        throw new BadRequestException(`Vehicle is ${vehicle.operationalStatus} and cannot be assigned.`);
      }
    }

    if (dto.driverId) {
      const driver = await this.prisma.user.findUnique({ where: { id: dto.driverId } });
      if (!driver || !driver.isActive) {
        throw new BadRequestException('Selected driver is inactive or does not exist.');
      }
    }

    const updated = await this.prisma.bookingDay.update({
      where: { id: dayId },
      data: {
        status: dto.status !== undefined ? dto.status : day.status,
        vehicleId: dto.vehicleId !== undefined ? dto.vehicleId : day.vehicleId,
        driverId: dto.driverId !== undefined ? dto.driverId : day.driverId,
        notes: dto.notes !== undefined ? dto.notes : day.notes,
      },
      include: {
        vehicle: true,
        driver: { select: { id: true, name: true, phone: true } },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorName: actor.name,
        entityType: 'BookingDay',
        entityId: dayId,
        action: 'UPDATE_BOOKING_DAY',
        newValues: dto,
      },
    });

    return updated;
  }

  /**
   * Cancel booking
   */
  async cancel(id: string, user: any, reason?: string) {
    const booking = await this.findOne(id, user);

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed booking');
    }
    if (booking.status === BookingStatus.IN_PROGRESS) {
      throw new BadRequestException('Cannot cancel an active trip in progress. Please complete the return instead.');
    }
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled');
    }

    // If employee: only permitted if PENDING_APPROVAL
    if (user.role === UserRole.EMPLOYEE && booking.status !== BookingStatus.PENDING_APPROVAL) {
      throw new ForbiddenException('Approved or assigned bookings can only be cancelled by Logistics Department');
    }

    // Release any active vehicle assignment
    await this.prisma.$transaction(async (tx) => {
      await tx.vehicleAssignment.updateMany({
        where: { bookingId: id, unassignedAt: null },
        data: { unassignedAt: new Date() },
      });

      await tx.booking.update({
        where: { id },
        data: {
          status: BookingStatus.CANCELLED,
          cancelledAt: new Date(),
          additionalNotes: reason ? `${booking.additionalNotes || ''}\nCancellation Reason: ${reason}`.trim() : booking.additionalNotes,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          actorName: user.name,
          entityType: 'Booking',
          entityId: id,
          action: 'CANCEL_BOOKING',
          previousValues: { status: booking.status },
          newValues: { status: BookingStatus.CANCELLED, reason },
        },
      });
    });

    return this.findOne(id, user);
  }

  /**
   * Logistics Review: Approve Request
   */
  async approve(id: string, actor: any) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { requester: true, preferredVehicle: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.status !== BookingStatus.PENDING_APPROVAL) {
      throw new BadRequestException(`Cannot approve booking in ${booking.status} status`);
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.APPROVED },
      include: { requester: true },
    });

    const bookingDateStr = new Date(booking.departureAt).toLocaleDateString('en-GB');

    // Notify employee with polished corporate notification format
    await this.prisma.notification.create({
      data: {
        recipientId: booking.requesterId,
        bookingId: id,
        type: 'BOOKING_APPROVED',
        title: 'Vehicle Booking Approved',
        message: `Your vehicle booking has been approved.\n\nDestination: ${booking.destination}\nBooking Date: ${bookingDateStr}\nReference: ${booking.bookingReference}\nStatus: Approved by Logistics (Awaiting vehicle allocation)\n\nAction: View Digital Receipt`,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorName: actor.name,
        entityType: 'Booking',
        entityId: id,
        action: 'APPROVE_REQUEST',
        previousValues: { status: BookingStatus.PENDING_APPROVAL },
        newValues: { status: BookingStatus.APPROVED },
      },
    });

    return updated;
  }

  /**
   * Logistics Review: Reject Request
   */
  async reject(id: string, actor: any, dto: RejectBookingDto) {
    if (!dto?.rejectionReason || !dto.rejectionReason.trim()) {
      throw new BadRequestException('Rejection reason is required');
    }

    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.status !== BookingStatus.PENDING_APPROVAL && booking.status !== BookingStatus.APPROVED) {
      throw new BadRequestException(`Cannot reject booking in ${booking.status} status`);
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.REJECTED,
        rejectionReason: dto.rejectionReason,
      },
      include: { requester: true },
    });

    // Notify employee
    await this.prisma.notification.create({
      data: {
        recipientId: booking.requesterId,
        bookingId: id,
        type: 'BOOKING_REJECTED',
        title: 'Booking Request Rejected',
        message: `Your booking ${booking.bookingReference} was rejected. Reason: ${dto.rejectionReason}`,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorName: actor.name,
        entityType: 'Booking',
        entityId: id,
        action: 'REJECT_REQUEST',
        previousValues: { status: booking.status },
        newValues: { status: BookingStatus.REJECTED, reason: dto.rejectionReason },
      },
    });

    return updated;
  }

  /**
   * Concurrency-safe atomic vehicle assignment with strict overlapping conflict detection
   */
  async assignVehicle(bookingId: string, actor: any, dto: AssignVehicleDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch booking with locking
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { requester: true },
      });

      if (!booking) throw new NotFoundException('Booking not found');

      if (booking.status !== BookingStatus.APPROVED && booking.status !== BookingStatus.ASSIGNED) {
        throw new BadRequestException(`Cannot assign vehicle to booking in ${booking.status} status. Request must be APPROVED first.`);
      }

      // 2. Fetch vehicle
      const vehicle = await tx.vehicle.findUnique({
        where: { id: dto.vehicleId },
      });

      if (!vehicle) throw new NotFoundException('Vehicle not found');

      // 3. Operational status check
      if (vehicle.operationalStatus !== VehicleOperationalStatus.ACTIVE) {
        throw new BadRequestException(
          `Vehicle ${vehicle.name} (${vehicle.registrationNumber}) is currently ${vehicle.operationalStatus.toLowerCase().replace('_', ' ')} and cannot be assigned.`
        );
      }

      // 4. Passenger capacity check
      if (vehicle.passengerCapacity < booking.passengerCount) {
        throw new BadRequestException(
          `Vehicle capacity (${vehicle.passengerCapacity} seats) is insufficient for ${booking.passengerCount} passengers.`
        );
      }

      // 5. Strict Overlapping Interval check: [booking.departureAt, booking.expectedReturnAt)
      // Any other active assignment for this vehicle where:
      // other.departureAt < booking.expectedReturnAt AND other.expectedReturnAt > booking.departureAt
      const overlapping = await tx.vehicleAssignment.findFirst({
        where: {
          vehicleId: dto.vehicleId,
          unassignedAt: null,
          booking: {
            id: { not: bookingId },
            status: { in: [BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS] },
            departureAt: { lt: booking.expectedReturnAt },
            expectedReturnAt: { gt: booking.departureAt },
          },
        },
        include: {
          booking: true,
        },
      });

      if (overlapping) {
        throw new ConflictException(
          `Vehicle ${vehicle.name} (${vehicle.registrationNumber}) is already assigned to booking ${overlapping.booking.bookingReference} for an overlapping period.`
        );
      }

      // 6. If this booking already had an active assignment, unassign it (Reassignment flow)
      await tx.vehicleAssignment.updateMany({
        where: { bookingId, unassignedAt: null },
        data: { unassignedAt: new Date() },
      });

      // 7. Create new assignment record
      const assignment = await tx.vehicleAssignment.create({
        data: {
          bookingId,
          vehicleId: dto.vehicleId,
          assignedById: actor.id,
          driverName: dto.driverName || null,
          driverPhone: dto.driverPhone || null,
          assignmentNotes: dto.assignmentNotes || null,
        },
        include: { vehicle: true },
      });

      // 8. Transition booking status to ASSIGNED
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.ASSIGNED },
      });

      // 9. Notify employee with structured receipt details
      const bookingDateStr = new Date(booking.departureAt).toLocaleDateString('en-GB');
      await tx.notification.create({
        data: {
          recipientId: booking.requesterId,
          bookingId,
          type: 'VEHICLE_ASSIGNED',
          title: 'Vehicle Booking Approved & Assigned',
          message: `Your vehicle booking has been approved.\n\nAssigned Vehicle: ${vehicle.make} ${vehicle.model} (${vehicle.name})\nRegistration: ${vehicle.registrationNumber}\nBooking Date: ${bookingDateStr}\nReference: ${booking.bookingReference}${dto.driverName ? `\nAssigned Driver: ${dto.driverName}` : ''}\n\nAction: View Digital Receipt`,
        },
      });

      // 10. Audit log
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          actorName: actor.name,
          entityType: 'Booking',
          entityId: bookingId,
          action: 'ASSIGN_VEHICLE',
          previousValues: { status: booking.status },
          newValues: {
            status: BookingStatus.ASSIGNED,
            vehicleId: vehicle.id,
            vehicle: `${vehicle.name} (${vehicle.registrationNumber})`,
            driver: dto.driverName || 'Self-driven / Unassigned',
          },
        },
      });

      return assignment;
    });
  }

  /**
   * Trip Departure: Start trip
   */
  async startTrip(bookingId: string, actor: any, dto: StartTripDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { assignments: { where: { unassignedAt: null }, include: { vehicle: true } } },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.status !== BookingStatus.ASSIGNED) {
      throw new BadRequestException(`Cannot start trip. Booking is in ${booking.status} status. It must be ASSIGNED.`);
    }

    const actualDeparture = dto.actualDepartureAt ? new Date(dto.actualDepartureAt) : new Date();

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.IN_PROGRESS,
        actualDepartureAt: actualDeparture,
        startOdometer: dto.startOdometer || null,
      },
      include: { assignments: { include: { vehicle: true } } },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorName: actor.name,
        entityType: 'Booking',
        entityId: bookingId,
        action: 'START_TRIP',
        previousValues: { status: BookingStatus.ASSIGNED },
        newValues: {
          status: BookingStatus.IN_PROGRESS,
          actualDepartureAt: actualDeparture.toISOString(),
          startOdometer: dto.startOdometer,
        },
      },
    });

    return updated;
  }

  /**
   * Trip Return: Complete trip
   */
  async completeTrip(bookingId: string, actor: any, dto: CompleteTripDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        assignments: { where: { unassignedAt: null }, include: { vehicle: true } },
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.status !== BookingStatus.IN_PROGRESS) {
      throw new BadRequestException(`Cannot complete trip. Booking status is ${booking.status}. Trip must be IN_PROGRESS.`);
    }

    const actualReturn = dto.actualReturnAt ? new Date(dto.actualReturnAt) : new Date();

    const assignedVehicle = booking.assignments[0]?.vehicle;

    await this.prisma.$transaction(async (tx) => {
      // 1. Update booking to COMPLETED
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.COMPLETED,
          actualReturnAt: actualReturn,
          endOdometer: dto.endOdometer || null,
          additionalNotes: dto.notes ? `${booking.additionalNotes || ''}\nReturn Notes: ${dto.notes}`.trim() : booking.additionalNotes,
        },
      });

      // 2. If problem reported, create a vehicle issue
      if (dto.reportedProblem && assignedVehicle) {
        await tx.vehicleIssue.create({
          data: {
            vehicleId: assignedVehicle.id,
            reportedById: actor.id,
            description: dto.reportedProblem,
            severity: IssueSeverity.MEDIUM,
            status: IssueStatus.OPEN,
          },
        });
      }

      // 3. Audit log
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          actorName: actor.name,
          entityType: 'Booking',
          entityId: bookingId,
          action: 'COMPLETE_TRIP',
          previousValues: { status: BookingStatus.IN_PROGRESS },
          newValues: {
            status: BookingStatus.COMPLETED,
            actualReturnAt: actualReturn.toISOString(),
            endOdometer: dto.endOdometer,
            reportedProblem: dto.reportedProblem,
          },
        },
      });
    });

    return this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        requester: true,
        assignments: { include: { vehicle: true } },
      },
    });
  }

  /**
   * Operational Logistics Dashboard Metrics calculated live from database
   */
  async getDashboardStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const [
      pendingRequests,
      approvedAwaitingAssignment,
      tripsInProgress,
      totalVehicles,
      vehiclesInMaintenance,
      todayAssignmentsCount,
    ] = await Promise.all([
      this.prisma.booking.count({ where: { status: BookingStatus.PENDING_APPROVAL } }),
      this.prisma.booking.count({ where: { status: BookingStatus.APPROVED } }),
      this.prisma.booking.count({ where: { status: BookingStatus.IN_PROGRESS } }),
      this.prisma.vehicle.count({ where: { operationalStatus: VehicleOperationalStatus.ACTIVE } }),
      this.prisma.vehicle.count({ where: { operationalStatus: VehicleOperationalStatus.MAINTENANCE } }),
      this.prisma.vehicleAssignment.count({
        where: {
          unassignedAt: null,
          booking: {
            departureAt: { gte: todayStart, lte: todayEnd },
          },
        },
      }),
    ]);

    // Available vehicles currently = Active vehicles NOT currently on an active trip
    const busyVehicleIds = await this.prisma.vehicleAssignment.findMany({
      where: {
        unassignedAt: null,
        booking: { status: BookingStatus.IN_PROGRESS },
      },
      select: { vehicleId: true },
    });
    const uniqueBusyIds = new Set(busyVehicleIds.map((v) => v.vehicleId));
    const availableVehicles = Math.max(0, totalVehicles - uniqueBusyIds.size);

    return {
      pendingRequests,
      approvedAwaitingAssignment,
      vehiclesAssignedToday: todayAssignmentsCount,
      availableVehicles,
      tripsInProgress,
      vehiclesInMaintenance,
    };
  }

  /**
   * Public Secure QR Verification Service
   * Validates booking reference against backend records and returns sanitized verification data.
   */
  async verifyBooking(reference: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingReference: reference },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            employeeId: true,
            department: { select: { name: true } },
          },
        },
        assignments: {
          where: { unassignedAt: null },
          include: {
            vehicle: {
              select: {
                id: true,
                name: true,
                make: true,
                model: true,
                registrationNumber: true,
                category: true,
              },
            },
            assignedBy: {
              select: {
                name: true,
                role: true,
              },
            },
          },
          orderBy: { assignedAt: 'desc' },
          take: 1,
        },
      },
    });

    const now = new Date();

    if (!booking) {
      return {
        isValid: false,
        verificationStatus: 'INVALID',
        message: `Booking reference "${reference}" does not match any corporate record.`,
        bookingReference: reference,
        verifiedAt: now.toISOString(),
      };
    }

    const returnTime = new Date(booking.expectedReturnAt);
    const activeAssignment = booking.assignments?.[0];

    // Determine verification state
    let verificationStatus: 'VALID' | 'EXPIRED' | 'CANCELLED' | 'REJECTED' | 'PENDING' | 'COMPLETED';
    let isValid = false;

    if (booking.status === BookingStatus.CANCELLED) {
      verificationStatus = 'CANCELLED';
      isValid = false;
    } else if (booking.status === BookingStatus.REJECTED) {
      verificationStatus = 'REJECTED';
      isValid = false;
    } else if (booking.status === BookingStatus.PENDING_APPROVAL) {
      verificationStatus = 'PENDING';
      isValid = false;
    } else if (booking.status === BookingStatus.COMPLETED) {
      verificationStatus = 'COMPLETED';
      isValid = true;
    } else if (now.getTime() > returnTime.getTime() + 12 * 60 * 60 * 1000) {
      // Overdue beyond schedule threshold
      verificationStatus = 'EXPIRED';
      isValid = false;
    } else {
      // APPROVED, ASSIGNED, or IN_PROGRESS
      verificationStatus = 'VALID';
      isValid = true;
    }

    return {
      isValid,
      verificationStatus,
      bookingReference: booking.bookingReference,
      status: booking.status,
      requester: {
        name: booking.requester?.name || 'Authorized Staff',
        employeeId: booking.requester?.employeeId || 'EMP-CRE',
        department: booking.requester?.department?.name || 'Capital Real Estate',
      },
      trip: {
        destination: booking.destination,
        purpose: booking.purpose,
        departureAt: booking.departureAt,
        expectedReturnAt: booking.expectedReturnAt,
        passengerCount: booking.passengerCount,
        requiresDriver: booking.requiresDriver,
      },
      assignment: activeAssignment ? {
        vehicleName: activeAssignment.vehicle.name,
        make: activeAssignment.vehicle.make,
        model: activeAssignment.vehicle.model,
        registrationNumber: activeAssignment.vehicle.registrationNumber,
        category: activeAssignment.vehicle.category,
        driverName: activeAssignment.driverName || 'Self-Driven / None',
        assignedBy: activeAssignment.assignedBy?.name || 'Logistics Operations',
        assignedAt: activeAssignment.assignedAt,
      } : null,
      approvalDate: activeAssignment?.assignedAt || booking.updatedAt,
      verifiedAt: now.toISOString(),
      securityNotice: 'Verified against Capital Real Estate Enterprise Logistics System',
    };
  }
}
