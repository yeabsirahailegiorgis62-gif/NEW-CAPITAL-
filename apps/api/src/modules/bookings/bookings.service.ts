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
  UpdateBookingDayDto,
  DeclineAssignmentDto,
  ReportDelayDto,
  CancelBookingDto,
} from './bookings.dto';
import { BookingStatus, UserRole, VehicleOperationalStatus, IssueSeverity, IssueStatus } from '@prisma/client';
import * as crypto from 'crypto';

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
    const allowSameDay = settingsMap.get('allowSameDayRequests') ?? false;
    const allowWeekend = settingsMap.get('allowWeekendRequests') ?? false;
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
            driver: { select: { id: true, name: true, phone: true } },
            assignedBy: { select: { id: true, name: true } },
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
    const booking = await this.prisma.booking.findUnique({
      where: { id },
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
            driver: { select: { id: true, name: true, phone: true } },
            assignedBy: { select: { id: true, name: true } },
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

    return booking;
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

    const cancelled = await this.prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: reason || null,
      },
      include: { requester: true, assignments: { where: { unassignedAt: null } } },
    });

    // Unassign active vehicle
    await this.prisma.vehicleAssignment.updateMany({
      where: { bookingId: id, unassignedAt: null },
      data: { unassignedAt: new Date() },
    });

    // Audit log
    await this.prisma.auditLog.create({
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

    return cancelled;
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
   * Concurrency-safe atomic vehicle & driver assignment with double-booking prevention (Part 3)
   */
  async assignVehicle(bookingId: string, actor: any, dto: AssignVehicleDto) {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { requester: true },
      });

      if (!booking) throw new NotFoundException('Booking not found');

      if (booking.status !== BookingStatus.APPROVED && booking.status !== BookingStatus.ASSIGNED) {
        throw new BadRequestException(`Cannot assign vehicle to booking in ${booking.status} status. Request must be APPROVED first.`);
      }

      const vehicle = await tx.vehicle.findUnique({
        where: { id: dto.vehicleId },
      });

      if (!vehicle) throw new NotFoundException('Vehicle not found');

      if (vehicle.operationalStatus !== VehicleOperationalStatus.ACTIVE || vehicle.hasSafetyAlert) {
        throw new BadRequestException(
          `Vehicle ${vehicle.name} (${vehicle.registrationNumber}) is currently ${vehicle.operationalStatus.toLowerCase().replace('_', ' ')}${vehicle.hasSafetyAlert ? ' with active safety alert' : ''} and cannot be assigned.`,
        );
      }

      if (vehicle.passengerCapacity < booking.passengerCount) {
        throw new BadRequestException(
          `Vehicle capacity (${vehicle.passengerCapacity} seats) is insufficient for ${booking.passengerCount} passengers.`,
        );
      }

      // Check vehicle overlapping assignments
      const overlappingVehicle = await tx.vehicleAssignment.findFirst({
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
        include: { booking: true },
      });

      if (overlappingVehicle) {
        throw new ConflictException(
          `Vehicle ${vehicle.name} (${vehicle.registrationNumber}) is already assigned to booking #${overlappingVehicle.booking.bookingReference} for an overlapping period.`,
        );
      }

      // Check driver overlap if driverId is supplied
      let driverName = dto.driverName || null;
      let driverPhone = dto.driverPhone || null;

      if (dto.driverId) {
        const driver = await tx.user.findUnique({ where: { id: dto.driverId } });
        if (!driver || !driver.isActive) {
          throw new BadRequestException('Selected driver is inactive or does not exist');
        }
        driverName = driver.name;
        driverPhone = driver.phone || dto.driverPhone || null;

        const driverOverlap = await tx.vehicleAssignment.findFirst({
          where: {
            driverId: dto.driverId,
            unassignedAt: null,
            status: { in: ['PENDING_CONFIRMATION', 'CONFIRMED'] },
            booking: {
              id: { not: bookingId },
              status: { in: [BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS] },
              departureAt: { lt: booking.expectedReturnAt },
              expectedReturnAt: { gt: booking.departureAt },
            },
          },
          include: { booking: true },
        });

        if (driverOverlap) {
          throw new ConflictException(
            `Driver ${driver.name} is already assigned to overlapping mission #${driverOverlap.booking.bookingReference} (${driverOverlap.booking.destination}).`,
          );
        }
      }

      // Unassign existing assignment if reassigning
      await tx.vehicleAssignment.updateMany({
        where: { bookingId, unassignedAt: null },
        data: { unassignedAt: new Date() },
      });

      // Ensure booking has verification token
      if (!booking.verificationToken) {
        await tx.booking.update({
          where: { id: bookingId },
          data: { verificationToken: crypto.randomUUID() },
        });
      }

      // Create new assignment
      const assignment = await tx.vehicleAssignment.create({
        data: {
          bookingId,
          vehicleId: dto.vehicleId,
          assignedById: actor.id,
          driverId: dto.driverId || null,
          driverName,
          driverPhone,
          assignmentNotes: dto.assignmentNotes || null,
          status: dto.driverId ? 'PENDING_CONFIRMATION' : 'CONFIRMED',
        },
        include: { vehicle: true, driver: true },
      });

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.ASSIGNED },
      });

      // Notify requester
      const bookingDateStr = new Date(booking.departureAt).toLocaleDateString('en-GB');
      await tx.notification.create({
        data: {
          recipientId: booking.requesterId,
          bookingId,
          type: 'VEHICLE_ASSIGNED',
          title: 'Vehicle Booking Approved & Assigned',
          message: `Your vehicle booking has been approved.\n\nAssigned Vehicle: ${vehicle.make} ${vehicle.model} (${vehicle.name})\nRegistration: ${vehicle.registrationNumber}\nBooking Date: ${bookingDateStr}\nReference: ${booking.bookingReference}${driverName ? `\nAssigned Driver: ${driverName}` : ''}`,
        },
      });

      // Notify driver if assigned
      if (dto.driverId) {
        await tx.notification.create({
          data: {
            recipientId: dto.driverId,
            bookingId,
            type: 'DRIVER_CONFIRMATION_REQUIRED',
            title: 'New Mission Assignment Pending Confirmation',
            message: `You have been assigned to trip ${booking.bookingReference} to ${booking.destination} on ${bookingDateStr}. Please confirm or decline in your Driver Portal.`,
          },
        });
      }

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
            driver: driverName || 'Self-driven / Unassigned',
          },
        },
      });

      return assignment;
    });
  }

  /**
   * Driver Assignment Confirmation (Part 3.D & 6.D)
   */
  async confirmAssignment(bookingId: string, driver: any) {
    const assignment = await this.prisma.vehicleAssignment.findFirst({
      where: {
        bookingId,
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
          bookingId,
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
  async declineAssignment(bookingId: string, driver: any, dto: DeclineAssignmentDto) {
    const assignment = await this.prisma.vehicleAssignment.findFirst({
      where: {
        bookingId,
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
      where: { id: bookingId },
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
          bookingId,
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
