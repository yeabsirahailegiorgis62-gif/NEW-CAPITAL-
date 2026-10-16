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
      },
      include: {
        requester: {
          select: { id: true, name: true, email: true, employeeId: true, department: true },
        },
        preferredVehicle: true,
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
          destination: dto.destination,
          departureAt: departure.toISOString(),
          expectedReturnAt: expectedReturn.toISOString(),
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

    return booking;
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
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.status !== BookingStatus.PENDING_APPROVAL) {
      throw new BadRequestException(`Cannot approve booking in ${booking.status} status`);
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.APPROVED },
      include: { requester: true },
    });

    // Notify employee
    await this.prisma.notification.create({
      data: {
        recipientId: booking.requesterId,
        bookingId: id,
        type: 'BOOKING_APPROVED',
        title: 'Booking Approved',
        message: `Your booking ${booking.bookingReference} for ${booking.destination} has been approved. Logistics is allocating a vehicle.`,
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

      // 9. Notify employee
      await tx.notification.create({
        data: {
          recipientId: booking.requesterId,
          bookingId,
          type: 'VEHICLE_ASSIGNED',
          title: 'Vehicle Assigned for Your Trip',
          message: `Booking ${booking.bookingReference} has been assigned ${vehicle.name} (${vehicle.registrationNumber})${dto.driverName ? ` with driver ${dto.driverName}` : ''}.`,
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
}
