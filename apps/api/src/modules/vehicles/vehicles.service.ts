import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVehicleDto, UpdateVehicleDto } from './vehicles.dto';
import { VehicleCategory, VehicleOperationalStatus, BookingStatus } from '@prisma/client';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: {
    search?: string;
    category?: VehicleCategory;
    status?: VehicleOperationalStatus;
  }) {
    const where: any = {};

    if (query?.category) {
      where.category = query.category;
    }

    if (query?.status) {
      where.operationalStatus = query.status;
    }

    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { make: { contains: query.search, mode: 'insensitive' } },
        { model: { contains: query.search, mode: 'insensitive' } },
        { registrationNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.vehicle.findMany({
      where,
      include: {
        _count: {
          select: {
            assignments: true,
            issues: { where: { status: { in: ['OPEN', 'IN_REVIEW'] } } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        issues: {
          include: { reportedBy: true },
          orderBy: { reportedAt: 'desc' },
        },
        assignments: {
          where: { unassignedAt: null },
          include: {
            booking: {
              include: { requester: true },
            },
            assignedBy: true,
          },
          orderBy: { assignedAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!vehicle) throw new NotFoundException('Vehicle not found');
    return vehicle;
  }

  async create(dto: CreateVehicleDto) {
    const existing = await this.prisma.vehicle.findUnique({
      where: { registrationNumber: dto.registrationNumber.toUpperCase().trim() },
    });

    if (existing) {
      throw new ConflictException(`Vehicle with registration number ${dto.registrationNumber} already exists`);
    }

    return this.prisma.vehicle.create({
      data: {
        name: dto.name,
        make: dto.make,
        model: dto.model,
        registrationNumber: dto.registrationNumber.toUpperCase().trim(),
        category: dto.category,
        passengerCapacity: dto.passengerCapacity,
        operationalStatus: dto.operationalStatus || VehicleOperationalStatus.ACTIVE,
        description: dto.description,
        notes: dto.notes,
      },
    });
  }

  async update(id: string, dto: UpdateVehicleDto) {
    await this.findOne(id);

    if (dto.registrationNumber) {
      const reg = dto.registrationNumber.toUpperCase().trim();
      const existing = await this.prisma.vehicle.findFirst({
        where: { registrationNumber: reg, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(`Vehicle with registration number ${reg} already exists`);
      }
    }

    return this.prisma.vehicle.update({
      where: { id },
      data: {
        ...dto,
        registrationNumber: dto.registrationNumber ? dto.registrationNumber.toUpperCase().trim() : undefined,
      },
    });
  }

  /**
   * Determine fleet availability for interval [departureAt, expectedReturnAt)
   */
  async getAvailability(departureAt: Date, expectedReturnAt: Date, minCapacity?: number, category?: VehicleCategory) {
    // 1. Fetch all vehicles that match operational status and capacity
    const where: any = {};
    if (minCapacity) {
      where.passengerCapacity = { gte: minCapacity };
    }
    if (category) {
      where.category = category;
    }

    const vehicles = await this.prisma.vehicle.findMany({
      where,
      include: {
        assignments: {
          where: {
            unassignedAt: null,
            booking: {
              status: { in: [BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS] },
              // Overlapping condition: booking.departureAt < requested.expectedReturnAt AND booking.expectedReturnAt > requested.departureAt
              departureAt: { lt: expectedReturnAt },
              expectedReturnAt: { gt: departureAt },
            },
          },
          include: {
            booking: {
              select: {
                id: true,
                bookingReference: true,
                departureAt: true,
                expectedReturnAt: true,
                destination: true,
                status: true,
              },
            },
          },
        },
        issues: {
          where: {
            status: { in: ['OPEN', 'IN_REVIEW'] },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // 2. Map availability statuses
    return vehicles.map((v) => {
      const isOperational = v.operationalStatus === VehicleOperationalStatus.ACTIVE;
      const overlappingAssignment = v.assignments.length > 0 ? v.assignments[0] : null;
      const isAvailable = isOperational && !overlappingAssignment;

      let reason = '';
      if (!isOperational) {
        reason = `Vehicle is ${v.operationalStatus.toLowerCase().replace('_', ' ')}`;
      } else if (overlappingAssignment) {
        reason = `Assigned to booking ${overlappingAssignment.booking.bookingReference} (${overlappingAssignment.booking.destination})`;
      }

      return {
        vehicle: {
          id: v.id,
          name: v.name,
          make: v.make,
          model: v.model,
          registrationNumber: v.registrationNumber,
          category: v.category,
          passengerCapacity: v.passengerCapacity,
          operationalStatus: v.operationalStatus,
          openIssuesCount: v.issues.length,
        },
        isAvailable,
        availabilityStatus: isAvailable ? 'AVAILABLE' : 'UNAVAILABLE',
        reason,
        activeBookingConflict: overlappingAssignment?.booking || null,
      };
    });
  }
}
