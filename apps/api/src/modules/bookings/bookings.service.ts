// SERVICE: Booking business logic — policy checks, status transitions, assignment, trip close-out.
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateBookingDto,
  RejectBookingDto,
  AssignVehicleDto,
  StartTripDto,
  CompleteTripDto,
  UpdateBookingDayDto,
  DeclineAssignmentDto,
  ReportDelayDto,
  CancelBookingDto,
} from './bookings.dto';
import { BookingStatus, UserRole, VehicleOperationalStatus, IssueSeverity, IssueStatus } from '@prisma/client';
import {
  getSlotInterval,
  intervalsOverlap,
  doesAssignmentConflict,
  doesBookingDayConflict,
} from '../vehicles/vehicles.service';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  // DEPENDENCY INJECTION: Database access through the shared PrismaService.
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

    const minNoticeHours = settingsMap.get('minimumNoticeHours') ?? 0;
    const allowSameDay = settingsMap.get('allowSameDayRequests') ?? true;
    const allowWeekend = settingsMap.get('allowWeekendRequests') ?? true;
    const maxCapacity = settingsMap.get('maxPassengerCapacity') ?? 14;

    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
      include: { department: true },
    });
    if (!requester) throw new NotFoundException('Requester account not found');

    const departure = new Date(dto.departureAt);
    const expectedReturn = new Date(dto.expectedReturnAt);
    const now = new Date();

    if (isNaN(departure.getTime()) || isNaN(expectedReturn.getTime())) {
      throw new BadRequestException('Invalid departure or return date/time format');
    }

    if (expectedReturn <= departure) {
      throw new BadRequestException('Expected return time must be strictly after departure time');
    }

    if (departure < now) {
      throw new BadRequestException('Departure time cannot be in the past');
    }

    // Notice validation
    const hoursNotice = (departure.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isSameDay = departure.toDateString() === now.toDateString();
    const isHighPriority = dto.priority === 'HIGH' || dto.priority === 'VIP' || dto.priority === 'URGENT';

    if (!allowSameDay && isSameDay && !isHighPriority) {
      throw new BadRequestException('Same-day transport requests are currently not permitted by system policy.');
    }

    if (minNoticeHours > 0 && hoursNotice < minNoticeHours && !isSameDay && !isHighPriority) {
      throw new BadRequestException(`Requests require a minimum notice of ${minNoticeHours} hours in advance.`);
    }

    const depDay = departure.getDay(); // 0 is Sun, 6 is Sat
    if (!allowWeekend && (depDay === 0 || depDay === 6) && !isHighPriority) {
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
          d.tripDate = departure.toISOString();
        }
      }
    }

    if (dto.passengerCount < 1) {
      throw new BadRequestException('Passenger count must be at least 1');
    }

    if (dto.passengerCount > maxCapacity) {
      throw new BadRequestException(`Passenger count exceeds system maximum capacity limit of ${maxCapacity}`);
    }

    // Generate human-readable booking reference e.g. CR-2026-0042
    const year = departure.getFullYear();
    const count = await this.prisma.booking.count();
    const sequence = String(count + 1).padStart(4, '0');
    const bookingReference = `CR-${year}-${sequence}`;

    // Cryptographic unguessable token for QR verification
    const verificationToken = crypto.randomUUID();

    const booking = await this.prisma.booking.create({
      data: {
        bookingReference,
        verificationToken,
        requesterId,
        destination: dto.destination.trim(),
        purpose: dto.purpose.trim(),
        departureAt: departure,
        expectedReturnAt: expectedReturn,
        passengerCount: dto.passengerCount,
        priority: dto.priority || 'NORMAL',
        passengerDetails: dto.passengerDetails ? dto.passengerDetails : undefined,
        preferredVehicleId: dto.preferredVehicleId || null,
        requiresDriver: dto.requiresDriver || false,
        additionalNotes: dto.additionalNotes || null,
        documentUrl: dto.documentUrl || null,
        status: BookingStatus.PENDING_APPROVAL,
        requestType: dto.requestType || 'DAILY',
        pickupLocation: dto.pickupLocation?.trim() || 'Capital Real Estate HQ, Bole Road',
        contactPhone: dto.contactPhone?.trim() || requester.phone || null,
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
          reference: booking.bookingReference,
          destination: booking.destination,
          passengerCount: booking.passengerCount,
          departureAt: booking.departureAt.toISOString(),
          requestType: booking.requestType,
        },
      },
    });

    return booking;
  }

  /**
   * Check for duplicate requests by requester, destination, and approximate departure window (Part 2.E)
   */
  async checkDuplicate(requesterId: string, destination: string, departureAtStr: string) {
    const departure = new Date(departureAtStr);
    if (isNaN(departure.getTime())) {
      return { hasPotentialDuplicate: false, duplicateBooking: null, warningMessage: null };
    }

    const windowStart = new Date(departure.getTime() - 4 * 60 * 60 * 1000);
    const windowEnd = new Date(departure.getTime() + 4 * 60 * 60 * 1000);

    const duplicate = await this.prisma.booking.findFirst({
      where: {
        requesterId,
        destination: { equals: destination.trim(), mode: 'insensitive' },
        departureAt: { gte: windowStart, lte: windowEnd },
        status: { in: [BookingStatus.PENDING_APPROVAL, BookingStatus.APPROVED, BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS] },
      },
      select: {
        id: true,
        bookingReference: true,
        destination: true,
        departureAt: true,
        status: true,
      },
    });

    return {
      hasPotentialDuplicate: Boolean(duplicate),
      duplicateBooking: duplicate,
      warningMessage: duplicate
        ? `Notice: You already have an active request (#${duplicate.bookingReference}) to "${duplicate.destination}" scheduled around this timeframe (${duplicate.status}).`
        : null,
    };
  }

  /**
   * List bookings with role-based scoping and filtering
   */
  async findAll(
    user: any,
    query?: {
      status?: BookingStatus;
      search?: string;
      from?: string;
      to?: string;
    },
  ) {
    const where: any = {};

    // Role-based visibility scoping
    if (user.role === UserRole.EMPLOYEE) {
      where.requesterId = user.id;
    } else if (user.role === UserRole.DRIVER) {
      where.OR = [
        { assignments: { some: { driverId: user.id, unassignedAt: null } } },
        { assignments: { some: { driverName: { equals: user.name, mode: 'insensitive' }, unassignedAt: null } } },
        { bookingDays: { some: { driverId: user.id } } },
      ];
    }

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.from || query?.to) {
      where.departureAt = {};
      if (query.from) where.departureAt.gte = new Date(query.from);
      if (query.to) where.departureAt.lte = new Date(query.to);
    }

    if (query?.search) {
      where.OR = [
        ...(where.OR || []),
        { bookingReference: { contains: query.search, mode: 'insensitive' } },
        { destination: { contains: query.search, mode: 'insensitive' } },
        { purpose: { contains: query.search, mode: 'insensitive' } },
        { requester: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.booking.findMany({
      where,
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            phone: true,
            department: true,
          },
        },
        preferredVehicle: true,
        bookingDays: {
          include: {
            vehicle: true,
            driver: { select: { id: true, name: true, phone: true } },
          },
        },
        assignments: {
          include: {
            vehicle: true,
            driver: { select: { id: true, name: true, phone: true, employeeId: true } },
            assignedBy: { select: { id: true, name: true, employeeId: true } },
          },
          orderBy: { assignedAt: 'desc' },
        },
      },
      orderBy: { departureAt: 'desc' },
    });
  }

  /**
   * Find single booking with authorization check
   */
  async findOne(id: string, user: any) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        OR: [
          { id },
          { bookingReference: id },
        ],
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            phone: true,
            department: true,
          },
        },
        preferredVehicle: true,
        bookingDays: {
          include: {
            vehicle: true,
            driver: { select: { id: true, name: true, phone: true, employeeId: true } },
          },
        },
        assignments: {
          include: {
            vehicle: true,
            driver: { select: { id: true, name: true, phone: true, employeeId: true } },
            assignedBy: { select: { id: true, name: true, employeeId: true } },
          },
          orderBy: { assignedAt: 'desc' },
        },
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    if (user.role === UserRole.EMPLOYEE && booking.requesterId !== user.id) {
      throw new ForbiddenException('You are not authorized to view this booking record');
    }

    if (user.role === UserRole.DRIVER) {
      const isAssigned =
        booking.assignments.some((a: any) => a.driverId === user.id || a.driverName?.toLowerCase() === user.name?.toLowerCase()) ||
        booking.bookingDays.some((bd: any) => bd.driverId === user.id);
      if (!isAssigned) {
        throw new ForbiddenException('You are not assigned as the driver for this trip');
      }
    }

    const auditLogs = await this.prisma.auditLog.findMany({
      where: { entityType: 'Booking', entityId: booking.id },
      orderBy: { createdAt: 'asc' },
    });

    return { ...booking, auditLogs };
  }

  /**
   * Update individual day of weekly booking
   */
  async updateBookingDay(dayId: string, actor: any, dto: UpdateBookingDayDto) {
    const day = await this.prisma.bookingDay.findUnique({
      where: { id: dayId },
      include: { booking: true },
    });

    if (!day) throw new NotFoundException('Booking day not found');

    if (dto.vehicleId) {
      const vehicle = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
      if (!vehicle) throw new NotFoundException('Vehicle not found');
      if (vehicle.operationalStatus !== VehicleOperationalStatus.ACTIVE || vehicle.hasSafetyAlert) {
        throw new BadRequestException(`Vehicle is ${vehicle.operationalStatus} or has a safety alert and cannot be assigned.`);
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
        status: dto.status !== undefined ? (dto.status as any) : day.status,
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
        newValues: dto as any,
      },
    });

    return updated;
  }

  /**
   * Cancel booking or specific booking day (Part of Logistics Admin & Requester cancellation workflow)
   */
  async cancel(id: string, user: any, dtoOrReason?: CancelBookingDto | string) {
    const booking = await this.findOne(id, user);

    // 1. Role & authorization validation
    if (user.role === UserRole.DRIVER) {
      throw new ForbiddenException('Drivers cannot cancel bookings');
    }

    if (user.role === UserRole.EMPLOYEE) {
      if (booking.requesterId !== user.id) {
        throw new ForbiddenException('You cannot cancel another employee\'s booking');
      }
      if (booking.status === BookingStatus.ASSIGNED) {
        throw new ForbiddenException('Assigned bookings can only be cancelled by Logistics Administration');
      }
    }

    // 2. Operational state validation
    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed booking. Trip operational history is preserved.');
    }
    if (booking.status === BookingStatus.IN_PROGRESS) {
      throw new BadRequestException('Cannot cancel an active trip in progress. Please complete the return or record delay/incident instead.');
    }
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled');
    }

    // 3. Extract inputs
    let reasonText = '';
    let notesText: string | undefined = undefined;
    let targetBookingDayId: string | undefined = undefined;

    if (typeof dtoOrReason === 'string') {
      reasonText = dtoOrReason.trim();
    } else if (dtoOrReason && typeof dtoOrReason === 'object') {
      reasonText = (dtoOrReason.reason || dtoOrReason.cancellationReason || '').trim();
      notesText = dtoOrReason.notes?.trim();
      targetBookingDayId = dtoOrReason.bookingDayId?.trim();
    }

    if (!reasonText) {
      reasonText = 'Logistics Administrative Cancellation';
    }

    const fullReason = notesText ? `${reasonText} - Note: ${notesText}` : reasonText;

    // 4. Perform atomic cancellation in transaction
    return this.prisma.$transaction(async (tx) => {
      // Find latest or active assignment to notify driver
      const activeAssignment =
        booking.assignments.find((a: any) => !a.unassignedAt) ||
        booking.assignments[0];
      const assignedDriverId = activeAssignment?.driverId;
      const vehicleName = activeAssignment?.vehicle
        ? `${activeAssignment.vehicle.make} ${activeAssignment.vehicle.model} (${activeAssignment.vehicle.registrationNumber})`
        : 'Assigned Vehicle';

      // ── CASE A: Cancel specific BookingDay in weekly program ──
      if (targetBookingDayId && booking.bookingDays && booking.bookingDays.length > 0) {
        const targetDay = booking.bookingDays.find((d: any) => d.id === targetBookingDayId);
        if (!targetDay) {
          throw new NotFoundException('Selected trip day was not found in this weekly schedule');
        }
        if (targetDay.status === BookingStatus.CANCELLED) {
          throw new BadRequestException('This scheduled trip date is already cancelled');
        }
        if (targetDay.status === BookingStatus.COMPLETED) {
          throw new BadRequestException('Cannot cancel a completed trip date');
        }

        // Update target day
        await tx.bookingDay.update({
          where: { id: targetBookingDayId },
          data: {
            status: BookingStatus.CANCELLED,
            vehicleId: null,
            driverId: null,
            notes: notesText ? `Cancelled (${reasonText}) - Note: ${notesText}` : `Cancelled (${reasonText})`,
          },
        });

        // Check if all remaining days are cancelled
        const otherActiveDays = booking.bookingDays.filter(
          (d: any) => d.id !== targetBookingDayId && d.status !== BookingStatus.CANCELLED
        );
        const allDaysNowCancelled = otherActiveDays.length === 0;

        if (allDaysNowCancelled) {
          await tx.booking.update({
            where: { id },
            data: {
              status: BookingStatus.CANCELLED,
              cancelledAt: new Date(),
              cancellationReason: `All scheduled trips cancelled: ${fullReason}`,
            },
          });

          // Unassign any remaining active vehicle assignments
          await tx.vehicleAssignment.updateMany({
            where: { bookingId: id, unassignedAt: null },
            data: { unassignedAt: new Date() },
          });
        }

        const dateStr = new Date(targetDay.tripDate).toLocaleDateString('en-GB');

        // Notify requester for specific day
        await tx.notification.create({
          data: {
            recipientId: booking.requesterId,
            bookingId: id,
            type: 'BOOKING_DAY_CANCELLED',
            title: 'Weekly Trip Date Cancelled',
            message: `Your scheduled trip for ${targetDay.dayOfWeek} (${dateStr}) in booking #${booking.bookingReference} has been cancelled.\nReason: ${fullReason}`,
          },
        });

        // Notify driver for specific day if assigned
        const dayDriverId = targetDay.driverId || assignedDriverId;
        if (dayDriverId) {
          await tx.notification.create({
            data: {
              recipientId: dayDriverId,
              bookingId: id,
              type: 'ASSIGNMENT_CANCELLED',
              title: 'Scheduled Mission Date Cancelled',
              message: `Your mission for ${targetDay.dayOfWeek} (${dateStr}) on trip #${booking.bookingReference} (${booking.destination}) has been cancelled.\nReason: ${fullReason}`,
            },
          });
        }

        // Audit log
        await tx.auditLog.create({
          data: {
            actorId: user.id,
            actorName: user.name,
            entityType: 'BookingDay',
            entityId: targetBookingDayId,
            action: 'CANCEL_BOOKING_DAY',
            previousValues: { status: targetDay.status },
            newValues: {
              status: BookingStatus.CANCELLED,
              dayOfWeek: targetDay.dayOfWeek,
              tripDate: targetDay.tripDate,
              reason: reasonText,
              notes: notesText,
              allDaysNowCancelled,
            },
          },
        });

        return this.findOne(id, user);
      }

      // ── CASE B: Full Booking Cancellation ──
      const cancelledBooking = await tx.booking.update({
        where: { id },
        data: {
          status: BookingStatus.CANCELLED,
          cancelledAt: new Date(),
          cancellationReason: fullReason,
        },
        include: {
          requester: {
            select: { id: true, name: true, email: true },
          },
          assignments: { where: { unassignedAt: null } },
        },
      });

      // Safely release active vehicle assignments
      await tx.vehicleAssignment.updateMany({
        where: { bookingId: id, unassignedAt: null },
        data: { unassignedAt: new Date() },
      });

      // Update all associated booking days that are not already completed
      if (booking.bookingDays && booking.bookingDays.length > 0) {
        await tx.bookingDay.updateMany({
          where: {
            bookingId: id,
            status: { not: BookingStatus.COMPLETED },
          },
          data: {
            status: BookingStatus.CANCELLED,
            vehicleId: null,
            driverId: null,
            notes: notesText ? `Cancelled: ${reasonText} - ${notesText}` : `Cancelled: ${reasonText}`,
          },
        });
      }

      // Requester notification
      await tx.notification.create({
        data: {
          recipientId: booking.requesterId,
          bookingId: id,
          type: 'BOOKING_CANCELLED',
          title: 'Transport Request Cancelled',
          message: `Your transport request #${booking.bookingReference} for ${booking.destination} has been cancelled by logistics administration.\n\nReason: ${fullReason}`,
        },
      });

      // Driver notification if assigned
      if (assignedDriverId) {
        const scheduleStr = new Date(booking.departureAt).toLocaleDateString('en-GB');
        await tx.notification.create({
          data: {
            recipientId: assignedDriverId,
            bookingId: id,
            type: 'ASSIGNMENT_CANCELLED',
            title: 'Trip Assignment Cancelled',
            message: `Mission #${booking.bookingReference} (${booking.destination}) scheduled for ${scheduleStr} has been cancelled by logistics (${fullReason}). You and ${vehicleName} have been safely released for new dispatch.`,
          },
        });
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          actorName: user.name,
          entityType: 'Booking',
          entityId: id,
          action: 'CANCEL_BOOKING',
          previousValues: { status: booking.status },
          newValues: {
            status: BookingStatus.CANCELLED,
            reason: reasonText,
            notes: notesText,
            cancelledAt: new Date(),
            cancelledById: user.id,
            cancelledByName: user.name,
          },
        },
      });

      return cancelledBooking;
    });
  }

  /**
   * Logistics Review: Approve Request
   */
  async approve(id: string, actor: any) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { requester: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.status !== BookingStatus.PENDING_APPROVAL) {
      throw new BadRequestException(`Cannot approve booking in ${booking.status} status. It must be PENDING_APPROVAL.`);
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.APPROVED },
      include: { requester: true },
    });

    await this.prisma.notification.create({
      data: {
        recipientId: booking.requesterId,
        bookingId: id,
        type: 'BOOKING_APPROVED',
        title: 'Booking Request Approved',
        message: `Your booking ${booking.bookingReference} has been approved by Logistics. Vehicle assignment is underway.`,
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
        newValues: {
          status: BookingStatus.APPROVED,
          approverId: actor.id,
          approverName: actor.name,
          approvedAt: new Date().toISOString(),
        },
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
        newValues: {
          status: BookingStatus.REJECTED,
          reason: dto.rejectionReason,
          rejectedById: actor.id,
          rejectedByName: actor.name,
          rejectedAt: new Date().toISOString(),
        },
      },
    });

    return updated;
  }

  /**
   * Concurrency-safe atomic vehicle & driver assignment with double-booking prevention & multi-day verification
   */
  async assignVehicle(bookingId: string, actor: any, dto: AssignVehicleDto) {
    // 0. Authorization verification
    if (actor.role !== UserRole.LOGISTICS_ADMIN && actor.role !== UserRole.SYSTEM_ADMIN) {
      throw new ForbiddenException('Only logistics officers and system administrators are authorized to assign fleet resources.');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // 0.1 Concurrency control: acquire row-level locks on vehicle and driver to prevent race conditions
      await tx.$queryRaw`SELECT id FROM vehicles WHERE id = ${dto.vehicleId} FOR UPDATE`;
      if (dto.driverId) {
        await tx.$queryRaw`SELECT id FROM users WHERE id = ${dto.driverId} FOR UPDATE`;
      }

      // 1. Fetch booking with requester and weekly itinerary days
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: {
          requester: true,
          bookingDays: true,
          assignments: {
            where: { unassignedAt: null },
            include: { vehicle: true, driver: true },
          },
        },
      });

      if (!booking) throw new NotFoundException('Transport request not found.');

      // 2. Validate request status
      if (booking.status === BookingStatus.CANCELLED) {
        throw new BadRequestException('Cannot assign vehicle: this transport request has already been cancelled.');
      }
      if (booking.status === BookingStatus.REJECTED) {
        throw new BadRequestException('Cannot assign vehicle: this transport request was rejected.');
      }
      if (booking.status === BookingStatus.COMPLETED) {
        throw new BadRequestException('Cannot assign vehicle: this trip has already been completed.');
      }
      if (booking.status === BookingStatus.PENDING_APPROVAL) {
        throw new BadRequestException(
          'Cannot assign vehicle: this transport request is currently pending review and must be approved by logistics administration before allocation.'
        );
      }
      if (
        booking.status !== BookingStatus.APPROVED &&
        booking.status !== BookingStatus.ASSIGNED
      ) {
        throw new BadRequestException(
          `Cannot assign vehicle: request is currently in ${booking.status} status. Only approved requests can be allocated fleet resources.`
        );
      }

      // Validate travel dates
      const depDate = new Date(booking.departureAt);
      const retDate = new Date(booking.expectedReturnAt);
      const depTime = depDate.getTime();
      const retTime = retDate.getTime();
      if (isNaN(depTime) || isNaN(retTime) || retTime <= depTime) {
        throw new BadRequestException('Invalid trip schedule: expected return time must be strictly after departure time.');
      }

      // 3. Validate vehicle
      const vehicle = await tx.vehicle.findUnique({
        where: { id: dto.vehicleId },
      });

      if (!vehicle) throw new NotFoundException('Selected vehicle not found in fleet directory.');

      if (vehicle.operationalStatus !== VehicleOperationalStatus.ACTIVE) {
        const readableStatus = vehicle.operationalStatus.toLowerCase().replace('_', ' ');
        throw new BadRequestException(
          `Vehicle ${vehicle.name} (${vehicle.registrationNumber}) is unavailable: currently marked as ${readableStatus} and cannot be assigned to trips.`,
        );
      }

      if (vehicle.hasSafetyAlert) {
        throw new BadRequestException(
          `Vehicle ${vehicle.name} (${vehicle.registrationNumber}) is unavailable: vehicle has an active safety alert or critical unresolved maintenance concern.`,
        );
      }

      if (vehicle.passengerCapacity < booking.passengerCount) {
        throw new BadRequestException(
          `Vehicle capacity is insufficient: ${vehicle.name} has ${vehicle.passengerCapacity} passenger seats, but ${booking.passengerCount} passengers were requested.`,
        );
      }

      // 3.1 Check Workshop Maintenance Overlap
      const overlappingMaintenance = await tx.vehicleMaintenance.findFirst({
        where: {
          vehicleId: dto.vehicleId,
          status: { in: ['SCHEDULED', 'IN_PROGRESS', 'REPORTED'] },
        },
      });

      if (overlappingMaintenance) {
        let isMaintConflict = false;
        if (overlappingMaintenance.status === 'IN_PROGRESS') {
          isMaintConflict = true;
        } else {
          const mStart = new Date(overlappingMaintenance.serviceDate);
          mStart.setHours(0, 0, 0, 0);
          const mEnd = overlappingMaintenance.completedDate
            ? new Date(overlappingMaintenance.completedDate)
            : new Date(new Date(overlappingMaintenance.serviceDate).setHours(23, 59, 59, 999));

          if (booking.bookingDays && booking.bookingDays.length > 0) {
            isMaintConflict = booking.bookingDays.some((reqDay) => {
              const reqInterval = getSlotInterval(reqDay.tripDate, reqDay.timeSlot);
              return intervalsOverlap(mStart, mEnd, reqInterval.start, reqInterval.end);
            });
          } else {
            isMaintConflict = intervalsOverlap(depDate, retDate, mStart, mEnd);
          }
        }

        if (isMaintConflict) {
          throw new BadRequestException(
            `Vehicle ${vehicle.name} (${vehicle.registrationNumber}) is unavailable: vehicle has workshop maintenance scheduled (${overlappingMaintenance.category}) on ${new Date(overlappingMaintenance.serviceDate).toLocaleDateString('en-GB')}.`
          );
        }
      }

      // Load system assignment policies
      const settingsRecords = await tx.systemSetting.findMany();
      const settingsMap = new Map<string, any>();
      settingsRecords.forEach((s) => {
        try {
          settingsMap.set(s.key, JSON.parse(s.value));
        } catch {
          settingsMap.set(s.key, s.value);
        }
      });
      const preventDoubleVehicle = settingsMap.get('preventDoubleVehicleAssignment') ?? true;
      const preventDoubleDriver = settingsMap.get('preventDoubleDriverAssignment') ?? true;
      const requireValidLicense = settingsMap.get('requireValidDriverLicense') ?? true;

      // 4. Validate Vehicle Overlap across whole interval & multi-day time slots
      if (preventDoubleVehicle) {
        const activeVehicleAssignments = await tx.vehicleAssignment.findMany({
          where: {
            vehicleId: dto.vehicleId,
            unassignedAt: null,
            booking: {
              id: { not: bookingId },
              status: { in: [BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS] },
            },
          },
          include: {
            booking: {
              include: { bookingDays: true },
            },
          },
        });

        const conflictingAssignment = activeVehicleAssignments.find((asgn) =>
          doesAssignmentConflict(asgn, depDate, retDate, booking.bookingDays)
        );

        if (conflictingAssignment) {
          throw new ConflictException(
            'This vehicle is already assigned to another trip during the selected time. Please select an available vehicle.'
          );
        }

        // Slot-precise check against existing bookingDays
        const overlappingBookingDays = await tx.bookingDay.findMany({
          where: {
            vehicleId: dto.vehicleId,
            bookingId: { not: bookingId },
            status: { in: [BookingStatus.APPROVED, BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS] },
            booking: {
              status: { in: [BookingStatus.APPROVED, BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS] },
            },
          },
          include: {
            booking: { select: { id: true, bookingReference: true, destination: true } },
          },
        });

        const conflictingBookingDay = overlappingBookingDays.find((bd) =>
          doesBookingDayConflict(bd, depDate, retDate, booking.bookingDays)
        );

        if (conflictingBookingDay) {
          throw new ConflictException(
            'This vehicle is already assigned to another trip during the selected time. Please select an available vehicle.'
          );
        }
      }

      // 6. Validate Driver Availability (if assigned)
      let driverName = dto.driverName ? dto.driverName.trim() : null;
      let driverPhone = dto.driverPhone ? dto.driverPhone.trim() : null;

      if (dto.driverId) {
        const driver = await tx.user.findUnique({ where: { id: dto.driverId } });
        if (!driver) {
          throw new NotFoundException('Selected chauffeur not found in user directory.');
        }
        if (!driver.isActive) {
          throw new BadRequestException(`Selected chauffeur ${driver.name} is currently inactive or ineligible.`);
        }

        if (requireValidLicense && (!driver.licenseNumber || !driver.licenseNumber.trim())) {
          throw new BadRequestException(
            `Driver assignment policy violation: ${driver.name} does not have a verified commercial driver license on file. System policy requires a valid license for all assigned chauffeurs.`,
          );
        }

        driverName = driver.name;
        driverPhone = driverPhone || driver.phone || null;

        // Check driver overlapping vehicle assignments
        if (preventDoubleDriver) {
          const activeDriverAssignments = await tx.vehicleAssignment.findMany({
            where: {
              driverId: dto.driverId,
              unassignedAt: null,
              status: { in: ['PENDING_CONFIRMATION', 'CONFIRMED'] },
              booking: {
                id: { not: bookingId },
                status: { in: [BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS] },
              },
            },
            include: {
              booking: {
                include: { bookingDays: true },
              },
            },
          });

          const driverConflict = activeDriverAssignments.find((asgn) =>
            doesAssignmentConflict(asgn, depDate, retDate, booking.bookingDays)
          );

          if (driverConflict) {
            throw new ConflictException(
              `Driver unavailable: ${driver.name} is already assigned to another trip during this schedule (#${driverConflict.booking.bookingReference} to ${driverConflict.booking.destination}).`,
            );
          }

          // Check driver overlapping booking days with slot precision
          const overlappingDriverDays = await tx.bookingDay.findMany({
            where: {
              driverId: dto.driverId,
              bookingId: { not: bookingId },
              status: { in: [BookingStatus.APPROVED, BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS] },
              booking: {
                status: { in: [BookingStatus.APPROVED, BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS] },
              },
            },
            include: {
              booking: { select: { id: true, bookingReference: true, destination: true } },
            },
          });

          const conflictingDriverDay = overlappingDriverDays.find((bd) =>
            doesBookingDayConflict(bd, depDate, retDate, booking.bookingDays)
          );

          if (conflictingDriverDay) {
            const conflictDate = new Date(conflictingDriverDay.tripDate).toLocaleDateString('en-GB');
            throw new ConflictException(
              `Driver unavailable: ${driver.name} is already allocated to booking #${conflictingDriverDay.booking.bookingReference} on ${conflictDate} (${conflictingDriverDay.timeSlot}).`,
            );
          }
        }
      }

      // 7. Safe Reassignment Handling: archive prior active assignment
      const previousAssignment = booking.assignments?.[0];
      const isReassignment = !!previousAssignment;

      if (isReassignment) {
        await tx.vehicleAssignment.updateMany({
          where: { bookingId, unassignedAt: null },
          data: { unassignedAt: new Date() },
        });

        // Notify previous driver of unassignment if driver changed
        if (previousAssignment.driverId && previousAssignment.driverId !== dto.driverId) {
          try {
            await tx.notification.create({
              data: {
                recipientId: previousAssignment.driverId,
                bookingId,
                type: 'ASSIGNMENT_REASSIGNED',
                title: 'Mission Assignment Reallocated',
                message: `Your assignment to trip #${booking.bookingReference} (${booking.destination}) was reallocated by logistics dispatch.`,
              },
            });
          } catch (notifErr) {
            this.logger.warn('Failed to notify previous driver of unassignment:', notifErr);
          }
        }
      }

      // 8. Ensure booking has persistent verification token
      if (!booking.verificationToken) {
        await tx.booking.update({
          where: { id: bookingId },
          data: { verificationToken: crypto.randomUUID() },
        });
      }

      // 9. Create new active assignment
      const assignment = await tx.vehicleAssignment.create({
        data: {
          bookingId,
          vehicleId: dto.vehicleId,
          assignedById: actor.id,
          driverId: dto.driverId || null,
          driverName,
          driverPhone,
          assignmentNotes: dto.assignmentNotes?.trim() || null,
          status: dto.driverId ? 'PENDING_CONFIRMATION' : 'CONFIRMED',
        },
        include: { vehicle: true, driver: true },
      });

      // 10. Update booking status
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.ASSIGNED },
      });

      // 11. Synchronize all associated bookingDays
      if (booking.bookingDays && booking.bookingDays.length > 0) {
        await tx.bookingDay.updateMany({
          where: { bookingId },
          data: {
            vehicleId: dto.vehicleId,
            driverId: dto.driverId || null,
            status: BookingStatus.APPROVED,
          },
        });
      }

      // 12. Record comprehensive audit log
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          actorName: actor.name,
          entityType: 'Booking',
          entityId: bookingId,
          action: isReassignment ? 'REASSIGN_VEHICLE' : 'ASSIGN_VEHICLE',
          previousValues: isReassignment
            ? {
                vehicle: previousAssignment.vehicle?.name,
                plate: previousAssignment.vehicle?.registrationNumber,
                driver: previousAssignment.driverName,
              }
            : { status: booking.status },
          newValues: {
            status: BookingStatus.ASSIGNED,
            vehicleId: vehicle.id,
            vehicle: `${vehicle.name} (${vehicle.registrationNumber})`,
            plateNumber: vehicle.registrationNumber,
            driver: driverName || 'Self-driven / Unassigned',
            driverId: dto.driverId || null,
            assignedById: actor.id,
            assignedByName: actor.name,
            assignedAt: new Date().toISOString(),
            isReassignment,
            assignmentNotes: dto.assignmentNotes || null,
          },
        },
      });

      return {
        assignment,
        booking,
        vehicle,
        driverName,
        isReassignment,
      };
    });

    // 13. Notifications dispatched strictly upon successful assignment save
    const { assignment, booking, vehicle, driverName, isReassignment } = result;
    const departureStr = new Date(booking.departureAt).toLocaleString('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    const returnStr = new Date(booking.expectedReturnAt).toLocaleString('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    const vehicleDisplayName = `${vehicle.make} ${vehicle.model} (${vehicle.name})`;
    const driverInstructions =
      dto.assignmentNotes?.trim() || 'Pick up vehicle keys and fuel voucher at Gate 1 Dispatch office before departure.';

    // Notify requester
    try {
      await this.prisma.notification.create({
        data: {
          recipientId: booking.requesterId,
          bookingId,
          type: 'VEHICLE_ASSIGNED',
          title: isReassignment ? 'Vehicle Booking Reassigned' : 'Vehicle Booking Approved & Assigned',
          message: `Your transport request has been ${isReassignment ? 'reassigned' : 'approved'}.\n\nAssigned Vehicle: ${vehicleDisplayName}\nRegistration Plate: ${vehicle.registrationNumber}\nTravel Schedule: ${departureStr} to ${returnStr}\nDestination: ${booking.destination}\nReference: ${booking.bookingReference}${driverName ? `\nAssigned Driver: ${driverName}` : '\nDriver Mode: Self-Driven'}`,
        },
      });
    } catch (notifErr) {
      this.logger.error(`Failed to dispatch requester notification for booking ${booking.bookingReference}:`, notifErr);
    }

    // Notify driver if corporate driver is assigned
    if (dto.driverId) {
      try {
        const driverNotificationMessage = `You have been assigned to mission #${booking.bookingReference}.\nDestination: ${booking.destination}\nDeparture: ${departureStr}\nExpected Return: ${returnStr}\nVehicle: ${vehicleDisplayName}\nRegistration Plate: ${vehicle.registrationNumber}\nInstructions: ${driverInstructions}\n\nPlease confirm or decline in your Driver Portal.`;

        await this.prisma.notification.create({
          data: {
            recipientId: dto.driverId,
            bookingId,
            type: 'DRIVER_CONFIRMATION_REQUIRED',
            title: isReassignment ? 'Updated Mission Assignment' : 'New Mission Assignment Pending Confirmation',
            message: driverNotificationMessage,
          },
        });
      } catch (notifErr) {
        this.logger.error(`Failed to dispatch driver notification for booking ${booking.bookingReference}:`, notifErr);
      }
    }

    return assignment;
  }

  /**
   * Automatically allocate best-matched available vehicle and certified chauffeur for a transport request
   */
  async autoAssign(bookingId: string, actor: any) {
    if (actor.role !== UserRole.LOGISTICS_ADMIN && actor.role !== UserRole.SYSTEM_ADMIN) {
      throw new ForbiddenException('Only logistics officers and system administrators are authorized to auto-assign fleet resources.');
    }

    // 1. Fetch booking
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        requester: true,
        bookingDays: true,
        assignments: {
          where: { unassignedAt: null },
          include: { vehicle: true, driver: true },
        },
      },
    });

    if (!booking) throw new NotFoundException('Transport request not found.');

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Cannot auto-assign: this transport request has been cancelled.');
    }
    if (booking.status === BookingStatus.REJECTED) {
      throw new BadRequestException('Cannot auto-assign: this transport request was rejected.');
    }
    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Cannot auto-assign: this trip has already been completed.');
    }
    if (booking.status === BookingStatus.PENDING_APPROVAL) {
      throw new BadRequestException(
        'Cannot auto-assign: this transport request is currently pending review and must be approved by logistics administration before allocation.'
      );
    }
    if (
      booking.status !== BookingStatus.APPROVED &&
      booking.status !== BookingStatus.ASSIGNED
    ) {
      throw new BadRequestException(
        `Cannot auto-assign: request is currently in ${booking.status} status. Only approved requests can be allocated fleet resources.`
      );
    }

    const departure = new Date(booking.departureAt);
    const returnTime = new Date(booking.expectedReturnAt);

    // 2. Find operational ACTIVE vehicles
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        operationalStatus: VehicleOperationalStatus.ACTIVE,
      },
    });

    if (vehicles.length === 0) {
      throw new ConflictException('No available vehicles found in the fleet directory.');
    }

    // Filter vehicles by capacity >= booking.passengerCount
    const capacitySuitable = vehicles.filter((v) => v.passengerCapacity >= booking.passengerCount);
    const candidateVehicles = capacitySuitable.length > 0 ? capacitySuitable : vehicles;

    // Check conflict for each candidate vehicle
    const availableCandidateVehicles: typeof vehicles = [];

    for (const v of candidateVehicles) {
      // Check main trip overlap
      const conflict = await this.prisma.vehicleAssignment.findFirst({
        where: {
          vehicleId: v.id,
          unassignedAt: null,
          booking: {
            id: { not: bookingId },
            status: { in: [BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS] },
            departureAt: { lte: returnTime },
            expectedReturnAt: { gte: departure },
          },
        },
      });

      if (conflict) continue;

      // Check weekly booking days conflict
      let hasWeeklyConflict = false;
      if (booking.bookingDays && booking.bookingDays.length > 0) {
        for (const reqDay of booking.bookingDays) {
          const dayStart = new Date(reqDay.tripDate);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(reqDay.tripDate);
          dayEnd.setHours(23, 59, 59, 999);

          const dayConflict = await this.prisma.vehicleAssignment.findFirst({
            where: {
              vehicleId: v.id,
              unassignedAt: null,
              booking: {
                id: { not: bookingId },
                status: { in: [BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS] },
                departureAt: { lte: dayEnd },
                expectedReturnAt: { gte: dayStart },
              },
            },
          });
          if (dayConflict) {
            hasWeeklyConflict = true;
            break;
          }
        }
      }

      if (!hasWeeklyConflict) {
        availableCandidateVehicles.push(v);
      }
    }

    if (availableCandidateVehicles.length === 0) {
      throw new ConflictException(
        `Automated allocation could not find an unassigned vehicle with capacity >= ${booking.passengerCount} for ${departure.toLocaleDateString('en-GB')}. Please assign manually or adjust schedule.`
      );
    }

    // Sort by: closest capacity first, then lowest mileage
    availableCandidateVehicles.sort((a, b) => {
      const capDiffA = a.passengerCapacity - booking.passengerCount;
      const capDiffB = b.passengerCapacity - booking.passengerCount;
      if (capDiffA >= 0 && capDiffB >= 0 && capDiffA !== capDiffB) {
        return capDiffA - capDiffB;
      }
      return a.mileage - b.mileage;
    });

    const chosenVehicle = availableCandidateVehicles[0];

    // 3. Determine Driver
    let chosenDriverId: string | undefined = undefined;
    let driverName: string | undefined = undefined;
    let driverPhone: string | undefined = undefined;

    if (booking.requiresDriver) {
      const activeDrivers = await this.prisma.user.findMany({
        where: {
          role: UserRole.DRIVER,
          isActive: true,
        },
      });

      for (const d of activeDrivers) {
        const driverConflict = await this.prisma.vehicleAssignment.findFirst({
          where: {
            driverId: d.id,
            unassignedAt: null,
            status: { in: ['PENDING_CONFIRMATION', 'CONFIRMED'] },
            booking: {
              id: { not: bookingId },
              status: { in: [BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS] },
              departureAt: { lte: returnTime },
              expectedReturnAt: { gte: departure },
            },
          },
        });

        if (!driverConflict) {
          chosenDriverId = d.id;
          driverName = d.name;
          driverPhone = d.phone || undefined;
          break;
        }
      }

      if (!chosenDriverId) {
        throw new ConflictException(
          `Automated allocation could not find an available corporate chauffeur for the requested schedule (${departure.toLocaleDateString('en-GB')}). All fleet drivers have overlapping assignments. Please assign manually or select Self-Driven.`
        );
      }
    } else {
      // Self-driven
      driverName = booking.requester?.name || 'Self-Driven';
      driverPhone = booking.requester?.phone || undefined;
    }

    // 4. Delegate to atomic assignVehicle
    return this.assignVehicle(bookingId, actor, {
      vehicleId: chosenVehicle.id,
      driverId: chosenDriverId,
      driverName,
      driverPhone,
      assignmentNotes: 'Automatically assigned by Capital Fleet Dispatch Optimizer.',
    });
  }

  /**
   * Driver Assignment Confirmation (Part 3.D & 6.D)
   */
  async confirmAssignment(idOrBookingId: string, driver: any) {
    const assignment = await this.prisma.vehicleAssignment.findFirst({
      where: {
        OR: [{ bookingId: idOrBookingId }, { id: idOrBookingId }],
        driverId: driver.id,
        unassignedAt: null,
      },
      include: { booking: true, vehicle: true },
    });

    if (!assignment) {
      throw new NotFoundException('Active driver assignment not found for this mission');
    }

    const updated = await this.prisma.vehicleAssignment.update({
      where: { id: assignment.id },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
      include: { booking: true, vehicle: true },
    });

    // Notify logistics admins
    const logisticsAdmins = await this.prisma.user.findMany({
      where: { role: { in: [UserRole.LOGISTICS_ADMIN, UserRole.SYSTEM_ADMIN] }, isActive: true },
    });

    for (const a of logisticsAdmins) {
      await this.prisma.notification.create({
        data: {
          recipientId: a.id,
          bookingId: assignment.bookingId,
          type: 'DRIVER_CONFIRMED',
          title: 'Driver Confirmed Assignment',
          message: `Chauffeur ${driver.name} confirmed assignment for trip ${assignment.booking.bookingReference}.`,
        },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        actorId: driver.id,
        actorName: driver.name,
        entityType: 'VehicleAssignment',
        entityId: assignment.id,
        action: 'CONFIRM_ASSIGNMENT',
        newValues: { status: 'CONFIRMED' },
      },
    });

    return updated;
  }

  /**
   * Driver Assignment Decline with required reason (Part 3.D & 6.D)
   */
  async declineAssignment(idOrBookingId: string, driver: any, dto: DeclineAssignmentDto) {
    const assignment = await this.prisma.vehicleAssignment.findFirst({
      where: {
        OR: [{ bookingId: idOrBookingId }, { id: idOrBookingId }],
        driverId: driver.id,
        unassignedAt: null,
      },
      include: { booking: true, vehicle: true },
    });

    if (!assignment) {
      throw new NotFoundException('Active driver assignment not found for this mission');
    }

    const updated = await this.prisma.vehicleAssignment.update({
      where: { id: assignment.id },
      data: {
        status: 'DECLINED',
        declineReason: dto.reason,
        declinedAt: new Date(),
        unassignedAt: new Date(),
      },
      include: { booking: true, vehicle: true },
    });

    // Reset booking status to APPROVED so logistics can reassign
    await this.prisma.booking.update({
      where: { id: assignment.bookingId },
      data: { status: BookingStatus.APPROVED },
    });

    // Notify logistics admins immediately
    const logisticsAdmins = await this.prisma.user.findMany({
      where: { role: { in: [UserRole.LOGISTICS_ADMIN, UserRole.SYSTEM_ADMIN] }, isActive: true },
    });

    for (const a of logisticsAdmins) {
      await this.prisma.notification.create({
        data: {
          recipientId: a.id,
          bookingId: assignment.bookingId,
          type: 'DRIVER_DECLINED',
          title: `ALERT: Driver Declined Trip ${assignment.booking.bookingReference}`,
          message: `Chauffeur ${driver.name} declined assignment. Reason: "${dto.reason}". Reassignment required.`,
        },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        actorId: driver.id,
        actorName: driver.name,
        entityType: 'VehicleAssignment',
        entityId: assignment.id,
        action: 'DECLINE_ASSIGNMENT',
        newValues: { status: 'DECLINED', reason: dto.reason },
      },
    });

    return updated;
  }

  /**
   * Trip Departure: Start trip (Part 6.D)
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

    const activeAssignment = booking.assignments[0];

    // Authorization: Only assigned driver or administrator can initiate departure
    if (actor.role === UserRole.DRIVER && activeAssignment?.driverId && activeAssignment.driverId !== actor.id) {
      throw new ForbiddenException('Only the assigned chauffeur or logistics administrator can initiate trip departure.');
    }

    // Enforce driver acceptance lifecycle: driver must confirm before start
    if (activeAssignment?.driverId && activeAssignment.status !== 'CONFIRMED') {
      throw new BadRequestException(
        'Cannot start trip: the assigned driver must accept and confirm the assignment before departure.',
      );
    }

    // Validate vehicle operational status
    if (activeAssignment?.vehicle && activeAssignment.vehicle.operationalStatus !== VehicleOperationalStatus.ACTIVE) {
      throw new BadRequestException(
        `Cannot start trip: assigned vehicle ${activeAssignment.vehicle.name} is currently ${activeAssignment.vehicle.operationalStatus}.`,
      );
    }

    // Validate start odometer if provided
    if (dto.startOdometer != null && activeAssignment?.vehicle?.mileage != null) {
      if (dto.startOdometer < activeAssignment.vehicle.mileage) {
        throw new BadRequestException(
          `Start odometer (${dto.startOdometer} km) cannot be less than current recorded vehicle mileage (${activeAssignment.vehicle.mileage} km).`,
        );
      }
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

    // Notify requester
    await this.prisma.notification.create({
      data: {
        recipientId: booking.requesterId,
        bookingId,
        type: 'TRIP_STARTED',
        title: 'Trip In Progress',
        message: `Your transport trip ${booking.bookingReference} has departed towards ${booking.destination}.`,
      },
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
   * Mark arrival at destination (Part 6.D)
   */
  async markArrival(bookingId: string, actor: any) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { requester: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== BookingStatus.IN_PROGRESS) {
      throw new BadRequestException('Trip must be IN_PROGRESS to record arrival');
    }

    const arrivedAt = new Date();
    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { arrivedAt },
    });

    await this.prisma.notification.create({
      data: {
        recipientId: booking.requesterId,
        bookingId,
        type: 'TRIP_ARRIVED',
        title: 'Vehicle Arrived at Destination',
        message: `Your transport mission ${booking.bookingReference} has arrived safely at ${booking.destination}.`,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorName: actor.name,
        entityType: 'Booking',
        entityId: bookingId,
        action: 'MARK_ARRIVAL',
        newValues: { arrivedAt: arrivedAt.toISOString() },
      },
    });

    return updated;
  }

  /**
   * Report trip delay (Part 6.D)
   */
  async reportDelay(bookingId: string, actor: any, dto: ReportDelayDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { requester: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { delayReason: dto.delayReason },
    });

    await this.prisma.notification.create({
      data: {
        recipientId: booking.requesterId,
        bookingId,
        type: 'TRIP_DELAYED',
        title: 'Transport Delay Reported',
        message: `Trip ${booking.bookingReference}: Chauffeur reported delay: "${dto.delayReason}".`,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorName: actor.name,
        entityType: 'Booking',
        entityId: bookingId,
        action: 'REPORT_DELAY',
        newValues: { delayReason: dto.delayReason },
      },
    });

    return updated;
  }

  /**
   * Trip Return: Complete trip (Part 6.D)
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

    const activeAssignment = booking.assignments[0];

    // Authorization: Only assigned driver or administrator can complete trip
    if (actor.role === UserRole.DRIVER && activeAssignment?.driverId && activeAssignment.driverId !== actor.id) {
      throw new ForbiddenException('Only the assigned chauffeur or logistics administrator can complete this trip.');
    }

    // Validate odometer reading: endOdometer must be >= startOdometer
    if (dto.endOdometer != null && booking.startOdometer != null) {
      if (dto.endOdometer < booking.startOdometer) {
        throw new BadRequestException(
          `End odometer reading (${dto.endOdometer} km) cannot be less than start odometer reading (${booking.startOdometer} km).`,
        );
      }
    }

    const actualReturn = dto.actualReturnAt ? new Date(dto.actualReturnAt) : new Date();
    const assignedVehicle = activeAssignment?.vehicle;

    await this.prisma.$transaction(async (tx) => {
      // 1. Update booking to COMPLETED
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.COMPLETED,
          actualReturnAt: actualReturn,
          endOdometer: dto.endOdometer || null,
          tripNotes: dto.notes || null,
          additionalNotes: dto.notes
            ? `${booking.additionalNotes || ''}\nReturn Notes: ${dto.notes}`.trim()
            : booking.additionalNotes,
        },
      });

      // 2. Unassign active assignment
      await tx.vehicleAssignment.updateMany({
        where: { bookingId, unassignedAt: null },
        data: { unassignedAt: actualReturn },
      });

      // 3. Update vehicle mileage if higher
      if (assignedVehicle && dto.endOdometer && (!assignedVehicle.mileage || dto.endOdometer > assignedVehicle.mileage)) {
        await tx.vehicle.update({
          where: { id: assignedVehicle.id },
          data: { mileage: dto.endOdometer },
        });
      }

      // 4. If problem reported, create a vehicle issue
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

      // 5. Audit log
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
   * Operational Logistics Dashboard Metrics calculated live from database (Part 9)
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
      driversAwaitingConfirmation,
      seriousIssuesCount,
      totalDrivers,
    ] = await Promise.all([
      this.prisma.booking.count({ where: { status: BookingStatus.PENDING_APPROVAL } }),
      this.prisma.booking.count({ where: { status: BookingStatus.APPROVED } }),
      this.prisma.booking.count({ where: { status: BookingStatus.IN_PROGRESS } }),
      this.prisma.vehicle.count({ where: { operationalStatus: VehicleOperationalStatus.ACTIVE } }),
      this.prisma.vehicle.count({ where: { operationalStatus: VehicleOperationalStatus.MAINTENANCE } }),
      this.prisma.vehicleAssignment.count({
        where: {
          unassignedAt: null,
          booking: { departureAt: { gte: todayStart, lte: todayEnd } },
        },
      }),
      this.prisma.vehicleAssignment.count({
        where: { status: 'PENDING_CONFIRMATION', unassignedAt: null },
      }),
      this.prisma.vehicleIssue.count({
        where: { immediateSafetyConcern: true, status: { in: ['OPEN', 'IN_REVIEW'] } },
      }),
      this.prisma.user.count({
        where: { role: UserRole.DRIVER, isActive: true },
      }),
    ]);

    // Available vehicles currently = Active vehicles NOT currently on an in-progress trip
    const busyVehicleIds = await this.prisma.vehicleAssignment.findMany({
      where: {
        unassignedAt: null,
        booking: { status: BookingStatus.IN_PROGRESS },
      },
      select: { vehicleId: true },
    });
    const uniqueBusyIds = new Set(busyVehicleIds.map((v) => v.vehicleId));
    const availableVehicles = Math.max(0, totalVehicles - uniqueBusyIds.size);

    // Available drivers currently = Active drivers not currently in progress
    const busyDriverIds = await this.prisma.vehicleAssignment.findMany({
      where: {
        unassignedAt: null,
        booking: { status: BookingStatus.IN_PROGRESS },
        driverId: { not: null },
      },
      select: { driverId: true },
    });
    const uniqueBusyDriverIds = new Set(busyDriverIds.map((d) => d.driverId));
    const availableDrivers = Math.max(0, totalDrivers - uniqueBusyDriverIds.size);

    return {
      pendingRequests,
      approvedAwaitingAssignment,
      vehiclesAssignedToday: todayAssignmentsCount,
      availableVehicles,
      tripsInProgress,
      vehiclesInMaintenance,
      driversAwaitingConfirmation,
      availableDrivers,
      seriousIssuesCount,
    };
  }

  /**
   * Public Secure QR Verification by Token or Reference (Part 18)
   */
  async verifyBooking(referenceOrToken: string) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        OR: [{ bookingReference: referenceOrToken }, { verificationToken: referenceOrToken }],
      },
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
              select: { name: true, role: true },
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
        message: 'Security validation failed. Verification token does not match any corporate record.',
        verifiedAt: now.toISOString(),
      };
    }

    const returnTime = new Date(booking.expectedReturnAt);
    const activeAssignment = booking.assignments?.[0];

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
      verificationStatus = 'EXPIRED';
      isValid = false;
    } else {
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
      assignment: activeAssignment
        ? {
            vehicleName: activeAssignment.vehicle.name,
            make: activeAssignment.vehicle.make,
            model: activeAssignment.vehicle.model,
            registrationNumber: activeAssignment.vehicle.registrationNumber,
            category: activeAssignment.vehicle.category,
            driverName: activeAssignment.driverName || 'Self-Driven / None',
            assignedBy: activeAssignment.assignedBy?.name || 'Logistics Operations',
            assignedAt: activeAssignment.assignedAt,
          }
        : null,
      approvalDate: activeAssignment?.assignedAt || booking.updatedAt,
      verifiedAt: now.toISOString(),
      securityNotice: 'Verified against Capital Real Estate Enterprise Logistics System',
    };
  }
}
