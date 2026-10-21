import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BookingStatus, UserRole } from '@prisma/client';

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
              findMany: jest.fn(),
              update: jest.fn(),
              count: jest.fn().mockResolvedValue(0),
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
            },
            systemSetting: {
              findMany: jest.fn().mockResolvedValue([]),
              findUnique: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    prisma = module.get<PrismaService>(PrismaService);
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
      const departure = new Date(Date.now() + 86400000).toISOString();
      const returnTime = new Date(Date.now() + 86400000 + 3600000 * 4).toISOString();

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
});
