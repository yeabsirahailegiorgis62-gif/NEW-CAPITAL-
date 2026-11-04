import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { BookingStatus, UserRole, VehicleOperationalStatus } from '@prisma/client';

describe('BookingsService', () => {
  let service: BookingsService;
  let prisma: PrismaService;

  const mockBooking = {
    id: 'booking-1',
    bookingReference: 'CR-2026-0001',
    requesterId: 'user-1',
    destination: 'Bole Project Site, Addis Ababa',
    purpose: 'Site civil engineering progress inspection',
    departureAt: new Date(Date.now() + 86400000), // tomorrow
    expectedReturnAt: new Date(Date.now() + 86400000 + 3600000 * 4), // tomorrow + 4 hrs
    passengerCount: 3,
    preferredVehicleId: null,
    requiresDriver: false,
    additionalNotes: 'Gate 2 security pass needed',
    status: BookingStatus.PENDING_APPROVAL,
    rejectionReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    requester: {
      id: 'user-1',
      name: 'Abebe Girma',
      email: 'employee@capitalre.com',
      employeeId: 'EMP-101',
      department: { id: 'dept-1', name: 'Engineering' },
    },
    preferredVehicle: null,
    assignments: [],
    bookingDays: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: PrismaService,
          useValue: {
            booking: {
              create: jest.fn().mockResolvedValue(mockBooking),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              count: jest.fn().mockResolvedValue(0),
            },
            vehicle: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
            },
            driver: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
            },
            vehicleMaintenance: {
              findFirst: jest.fn().mockResolvedValue(null),
              findMany: jest.fn().mockResolvedValue([]),
            },
            bookingDay: {
              update: jest.fn(),
              updateMany: jest.fn(),
              findMany: jest.fn().mockResolvedValue([]),
            },
            vehicleAssignment: {
              create: jest.fn(),
              updateMany: jest.fn(),
              findMany: jest.fn().mockResolvedValue([]),
            },
            user: {
              findMany: jest.fn().mockResolvedValue([
                { id: 'admin-1', role: UserRole.LOGISTICS_ADMIN },
              ]),
              findUnique: jest.fn().mockResolvedValue({
                id: 'user-1',
                name: 'Abebe Girma',
                employeeId: 'EMP-101',
                phone: '+251911223344',
                department: { id: 'dept-1', name: 'Engineering' },
              }),
            },
            notification: {
              create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
            },
            auditLog: {
              create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
              findMany: jest.fn().mockResolvedValue([]),
            },
            systemSetting: {
              findMany: jest.fn().mockResolvedValue([]),
              findUnique: jest.fn(),
            },
            $queryRaw: jest.fn().mockResolvedValue([]),
            $transaction: jest.fn().mockImplementation(async (cb) => {
              if (typeof cb === 'function') {
                return cb(prisma);
              }
              return cb;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    prisma = module.get<PrismaService>(PrismaService);

    (prisma.booking.findFirst as jest.Mock).mockImplementation((args) =>
      (prisma.booking.findUnique as jest.Mock)(args),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw BadRequestException if departure is in the past', async () => {
      const pastDeparture = new Date(Date.now() - 3600000 * 2).toISOString();
      const returnTime = new Date(Date.now() + 3600000).toISOString();

      await expect(
        service.create('user-1', {
          destination: 'Bole Site',
          purpose: 'Inspection',
          departureAt: pastDeparture,
          expectedReturnAt: returnTime,
          passengerCount: 2,
          requiresDriver: false,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if departure is after return time', async () => {
      const departure = new Date(Date.now() + 3600000 * 5).toISOString();
      const returnTime = new Date(Date.now() + 3600000 * 2).toISOString();

      await expect(
        service.create('user-1', {
          destination: 'Sarbet Site',
          purpose: 'Meeting',
          departureAt: departure,
          expectedReturnAt: returnTime,
          passengerCount: 1,
          requiresDriver: false,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully create booking and notify logistics admins', async () => {
      const departure = new Date(Date.now() + 86400000 * 2).toISOString();
      const returnTime = new Date(Date.now() + 86400000 * 2 + 3600000 * 4).toISOString();

      const result = await service.create('user-1', {
        destination: 'Bole Project Site, Addis Ababa',
        purpose: 'Site civil engineering progress inspection',
        departureAt: departure,
        expectedReturnAt: returnTime,
        passengerCount: 3,
        requiresDriver: false,
      });

      expect(result).toBeDefined();
      expect(result.bookingReference).toBe('CR-2026-0001');
      expect(result.status).toBe(BookingStatus.PENDING_APPROVAL);
      expect(prisma.notification.create).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('reject', () => {
    it('should throw BadRequestException if rejection reason is empty', async () => {
      await expect(
        service.reject('booking-1', 'admin-1', { rejectionReason: '   ' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if booking does not exist', async () => {
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.reject('nonexistent', 'admin-1', { rejectionReason: 'No cars available' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update status to REJECTED and notify requester', async () => {
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.PENDING_APPROVAL,
      });
      (prisma.booking.update as jest.Mock).mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.REJECTED,
        rejectionReason: 'Vehicle maintenance scheduled during this window',
      });

      const updated = await service.reject('booking-1', 'admin-1', {
        rejectionReason: 'Vehicle maintenance scheduled during this window',
      });

      expect(updated.status).toBe(BookingStatus.REJECTED);
      expect(prisma.notification.create).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('approve', () => {
    it('should approve booking in PENDING_APPROVAL status', async () => {
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.PENDING_APPROVAL,
      });
      (prisma.booking.update as jest.Mock).mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.APPROVED,
      });

      const approved = await service.approve('booking-1', 'admin-1');
      expect(approved.status).toBe(BookingStatus.APPROVED);
      expect(prisma.notification.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if booking is not in PENDING_APPROVAL', async () => {
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.COMPLETED,
      });

      await expect(service.approve('booking-1', 'admin-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('cancel', () => {
    const adminUser = {
      id: 'admin-1',
      name: 'Yared Logistics',
      role: UserRole.LOGISTICS_ADMIN,
    };

    const assignedBooking = {
      ...mockBooking,
      status: BookingStatus.ASSIGNED,
      assignments: [
        {
          id: 'assign-1',
          vehicleId: 'veh-1',
          driverId: 'driver-1',
          driverName: 'Dawit Driver',
          unassignedAt: null,
          vehicle: {
            id: 'veh-1',
            make: 'Toyota',
            model: 'Hilux Double Cab',
            registrationNumber: 'AA-3-45678',
            name: 'Fleet Pickup 01',
          },
        },
      ],
      bookingDays: [],
    };

    it('should cancel assigned booking successfully and release vehicle and driver', async () => {
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(assignedBooking);
      (prisma.booking.update as jest.Mock).mockResolvedValue({
        ...assignedBooking,
        status: BookingStatus.CANCELLED,
        cancellationReason: 'Employee Reported an Accident - Note: Hospitalized following minor site incident',
        cancelledAt: new Date(),
      });

      const result = await service.cancel('booking-1', adminUser, {
        reason: 'Employee Reported an Accident',
        notes: 'Hospitalized following minor site incident',
      });

      expect(result.status).toBe(BookingStatus.CANCELLED);
      // Verify atomic booking cancellation update
      expect(prisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'booking-1' },
          data: expect.objectContaining({
            status: BookingStatus.CANCELLED,
            cancellationReason: 'Employee Reported an Accident - Note: Hospitalized following minor site incident',
          }),
        }),
      );
      // Verify safe resource release
      expect(prisma.vehicleAssignment.updateMany).toHaveBeenCalledWith({
        where: { bookingId: 'booking-1', unassignedAt: null },
        data: { unassignedAt: expect.any(Date) },
      });
      // Verify both employee and driver notifications
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            recipientId: assignedBooking.requesterId,
            type: 'BOOKING_CANCELLED',
          }),
        }),
      );
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            recipientId: 'driver-1',
            type: 'ASSIGNMENT_CANCELLED',
          }),
        }),
      );
      // Verify audit log
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'CANCEL_BOOKING',
            actorId: 'admin-1',
          }),
        }),
      );
    });

    it('should throw ForbiddenException if driver attempts to cancel booking', async () => {
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(assignedBooking);

      await expect(
        service.cancel('booking-1', { id: 'driver-1', role: UserRole.DRIVER }, 'Driver unavailable'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if unauthorized employee tries to cancel someone else booking', async () => {
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking);

      await expect(
        service.cancel('booking-1', { id: 'other-user', role: UserRole.EMPLOYEE }, 'Not my booking'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if employee tries to cancel an already assigned booking directly', async () => {
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(assignedBooking);

      await expect(
        service.cancel('booking-1', { id: 'user-1', role: UserRole.EMPLOYEE }, 'Cancelled trip'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if trip has already completed', async () => {
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue({
        ...assignedBooking,
        status: BookingStatus.COMPLETED,
      });

      await expect(
        service.cancel('booking-1', adminUser, 'Trip no longer needed'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if trip is currently in progress', async () => {
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue({
        ...assignedBooking,
        status: BookingStatus.IN_PROGRESS,
      });

      await expect(
        service.cancel('booking-1', adminUser, 'Trip no longer needed'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if booking is already cancelled', async () => {
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue({
        ...assignedBooking,
        status: BookingStatus.CANCELLED,
      });

      await expect(
        service.cancel('booking-1', adminUser, 'Trip already cancelled'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should cancel only a specific date in a weekly booking when bookingDayId is provided', async () => {
      const weeklyBooking = {
        ...assignedBooking,
        requestType: 'WEEKLY',
        bookingDays: [
          {
            id: 'day-1',
            dayOfWeek: 'MONDAY',
            tripDate: new Date('2026-10-26'),
            timeSlot: 'MORNING',
            status: BookingStatus.APPROVED,
            driverId: 'driver-1',
            vehicleId: 'veh-1',
          },
          {
            id: 'day-2',
            dayOfWeek: 'WEDNESDAY',
            tripDate: new Date('2026-10-28'),
            timeSlot: 'MORNING',
            status: BookingStatus.APPROVED,
            driverId: 'driver-1',
            vehicleId: 'veh-1',
          },
        ],
      };

      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(weeklyBooking);

      await service.cancel('booking-1', adminUser, {
        reason: 'Employee Unavailable',
        notes: 'Monday site meeting cancelled',
        bookingDayId: 'day-1',
      });

      // Target day updated to CANCELLED
      expect(prisma.bookingDay.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'day-1' },
          data: expect.objectContaining({
            status: BookingStatus.CANCELLED,
            vehicleId: null,
            driverId: null,
          }),
        }),
      );
      // Main booking should NOT be cancelled since Wednesday remains active
      expect(prisma.booking.update).not.toHaveBeenCalled();
      // Audit log recorded for BookingDay
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'CANCEL_BOOKING_DAY',
            entityId: 'day-1',
          }),
        }),
      );
    });
  });

  describe('assignVehicle', () => {
    const adminActor = {
      id: 'admin-1',
      name: 'Yared Logistics',
      role: UserRole.LOGISTICS_ADMIN,
    };

    const employeeActor = {
      id: 'emp-1',
      name: 'Abebe Girma',
      role: UserRole.EMPLOYEE,
    };

    it('should throw ForbiddenException if unauthorized employee attempts to assign vehicle', async () => {
      await expect(
        service.assignVehicle('booking-1', employeeActor, { vehicleId: 'veh-1' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if booking is in PENDING_APPROVAL status', async () => {
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.PENDING_APPROVAL,
      });

      await expect(
        service.assignVehicle('booking-1', adminActor, { vehicleId: 'veh-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if booking was REJECTED', async () => {
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.REJECTED,
      });

      await expect(
        service.assignVehicle('booking-1', adminActor, { vehicleId: 'veh-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if booking was CANCELLED', async () => {
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      });

      await expect(
        service.assignVehicle('booking-1', adminActor, { vehicleId: 'veh-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if vehicle has insufficient passenger capacity', async () => {
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.APPROVED,
        passengerCount: 5,
        departureAt: new Date(Date.now() + 86400000),
        expectedReturnAt: new Date(Date.now() + 86400000 + 3600000),
      });

      (prisma.vehicle.findUnique as jest.Mock).mockResolvedValue({
        id: 'veh-1',
        name: 'Small Sedan',
        registrationNumber: 'AA-2-12345',
        operationalStatus: VehicleOperationalStatus.ACTIVE,
        hasSafetyAlert: false,
        passengerCapacity: 3, // Less than 5 passengers
      });

      await expect(
        service.assignVehicle('booking-1', adminActor, { vehicleId: 'veh-1' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
