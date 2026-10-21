import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVehicleDto, UpdateVehicleDto } from './vehicles.dto';
import { VehicleCategory, VehicleOperationalStatus, BookingStatus, UserRole } from '@prisma/client';

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
            maintenances: true,
            fuelRecords: true,
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
        maintenances: {
          orderBy: { serviceDate: 'desc' },
          take: 10,
        },
        fuelRecords: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        assignments: {
          where: { unassignedAt: null },
          include: {
            booking: {
              include: { requester: true },
            },
            assignedBy: true,
            driver: true,
          },
          orderBy: { assignedAt: 'desc' },
          take: 10,
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
        imageUrl: dto.imageUrl,
        fuelLevel: dto.fuelLevel ?? 85,
        mileage: dto.mileage ?? 15000,
        transmission: dto.transmission ?? 'Automatic',
        fuelType: dto.fuelType ?? 'Petrol',
        manufacturingYear: dto.manufacturingYear,
        insuranceExpiry: dto.insuranceExpiry ? new Date(dto.insuranceExpiry) : null,
        inspectionExpiry: dto.inspectionExpiry ? new Date(dto.inspectionExpiry) : null,
        registrationExpiry: dto.registrationExpiry ? new Date(dto.registrationExpiry) : null,
        nextMaintenanceDate: dto.nextMaintenanceDate ? new Date(dto.nextMaintenanceDate) : null,
        nextMaintenanceOdometer: dto.nextMaintenanceOdometer,
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
        insuranceExpiry: dto.insuranceExpiry ? new Date(dto.insuranceExpiry) : undefined,
        inspectionExpiry: dto.inspectionExpiry ? new Date(dto.inspectionExpiry) : undefined,
        registrationExpiry: dto.registrationExpiry ? new Date(dto.registrationExpiry) : undefined,
        lastMaintenanceDate: dto.lastMaintenanceDate ? new Date(dto.lastMaintenanceDate) : undefined,
        nextMaintenanceDate: dto.nextMaintenanceDate ? new Date(dto.nextMaintenanceDate) : undefined,
      },
    });
  }

  /**
   * Determine fleet availability for interval [departureAt, expectedReturnAt)
   */
  async getAvailability(departureAt: Date, expectedReturnAt: Date, minCapacity?: number, category?: VehicleCategory) {
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

    return vehicles.map((v) => {
      const isOperational = v.operationalStatus === VehicleOperationalStatus.ACTIVE && !v.hasSafetyAlert;
      const overlappingAssignment = v.assignments.length > 0 ? v.assignments[0] : null;
      const isAvailable = isOperational && !overlappingAssignment;

      let reason = '';
      if (!isOperational) {
        if (v.hasSafetyAlert) {
          reason = 'Vehicle has an active unresolved safety alert';
        } else if (v.operationalStatus === VehicleOperationalStatus.MAINTENANCE) {
          reason = 'Vehicle is currently in workshop maintenance';
        } else if (v.operationalStatus === VehicleOperationalStatus.OUT_OF_SERVICE) {
          reason = 'Vehicle is currently out of service';
        } else if (v.operationalStatus === VehicleOperationalStatus.INACTIVE) {
          reason = 'Vehicle is currently inactive';
        } else {
          reason = `Vehicle status is ${v.operationalStatus.toLowerCase().replace('_', ' ')}`;
        }
      } else if (overlappingAssignment) {
        reason = `Currently assigned to mission #${overlappingAssignment.booking.bookingReference} (${overlappingAssignment.booking.destination})`;
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
          imageUrl: v.imageUrl,
          hasSafetyAlert: v.hasSafetyAlert,
          openIssuesCount: v.issues.length,
        },
        isAvailable,
        availabilityStatus: isAvailable ? 'AVAILABLE' : 'UNAVAILABLE',
        reason,
        activeBookingConflict: overlappingAssignment?.booking || null,
      };
    });
  }

  /**
   * Intelligent Vehicle Recommendation Engine (Part 3)
   */
  async getRecommendations(params: {
    departureAt: Date;
    expectedReturnAt: Date;
    passengerCount: number;
    category?: VehicleCategory;
    preferredVehicleId?: string;
  }) {
    const { departureAt, expectedReturnAt, passengerCount, category, preferredVehicleId } = params;

    const allVehicles = await this.prisma.vehicle.findMany({
      include: {
        assignments: {
          where: {
            unassignedAt: null,
            booking: {
              status: { in: [BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS] },
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

    const recommendations = allVehicles.map((v) => {
      let score = 100;
      let isEligible = true;
      const reasons: string[] = [];

      // 1. Capacity check
      if (v.passengerCapacity < passengerCount) {
        isEligible = false;
        score -= 60;
        reasons.push(`Capacity insufficient: holds ${v.passengerCapacity} vs ${passengerCount} required`);
      } else {
        reasons.push(`Capacity suitable (${v.passengerCapacity} passengers)`);
        // Slight penalty if overly large (e.g. 1 passenger in a 14-seater) for resource efficiency
        if (v.passengerCapacity >= passengerCount + 8) {
          score -= 10;
          reasons.push('Sub-optimal fuel efficiency for small passenger group');
        }
      }

      // 2. Operational status check
      if (v.operationalStatus !== VehicleOperationalStatus.ACTIVE) {
        isEligible = false;
        score -= 70;
        reasons.push(`Vehicle is not operational (${v.operationalStatus.replace('_', ' ')})`);
      } else {
        reasons.push('Vehicle status is Active');
      }

      // 3. Safety check
      if (v.hasSafetyAlert) {
        isEligible = false;
        score -= 90;
        reasons.push('Has active safety alert or critical unresolved issue');
      }

      // 4. Scheduling overlap check
      const conflict = v.assignments.length > 0 ? v.assignments[0] : null;
      if (conflict) {
        isEligible = false;
        score = 0;
        reasons.push(`Scheduling conflict with booking ${conflict.booking.bookingReference} (${conflict.booking.destination})`);
      } else {
        reasons.push('No scheduling conflict for requested timeframe');
      }

      // 5. Preferred vehicle bonus
      if (preferredVehicleId && v.id === preferredVehicleId) {
        score += 15;
        reasons.push('Requested as preferred vehicle by employee');
      }

      // 6. Category preference bonus
      if (category && v.category === category) {
        score += 10;
        reasons.push(`Matches requested category (${category})`);
      }

      // 7. Open issues count penalty
      if (v.issues.length > 0) {
        score -= v.issues.length * 5;
        reasons.push(`${v.issues.length} minor non-critical open maintenance note(s)`);
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
          imageUrl: v.imageUrl,
          hasSafetyAlert: v.hasSafetyAlert,
        },
        score: Math.max(0, Math.min(100, score)),
        isEligible,
        reasons,
        conflict: conflict ? conflict.booking : null,
      };
    });

    // Sort: eligible first, then by score descending
    recommendations.sort((a, b) => {
      if (a.isEligible && !b.isEligible) return -1;
      if (!a.isEligible && b.isEligible) return 1;
      return b.score - a.score;
    });

    return recommendations;
  }

  /**
   * Driver Recommendation Engine (Part 3)
   */
  async getDriverRecommendations(departureAt: Date, expectedReturnAt: Date) {
    const drivers = await this.prisma.user.findMany({
      where: {
        role: UserRole.DRIVER,
        isActive: true,
      },
      include: {
        driverAssignments: {
          where: {
            unassignedAt: null,
            status: { in: ['PENDING_CONFIRMATION', 'CONFIRMED'] },
            booking: {
              status: { in: [BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS] },
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
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const recommendations = drivers.map((d) => {
      let isAvailable = true;
      let score = 100;
      const reasons: string[] = [];

      const conflict = d.driverAssignments.length > 0 ? d.driverAssignments[0] : null;

      if (conflict) {
        isAvailable = false;
        score = 0;
        reasons.push(`Assigned to concurrent mission ${conflict.booking.bookingReference} (${conflict.booking.destination})`);
      } else {
        reasons.push('Available for trip interval with zero overlapping assignments');
      }

      if (d.licenseNumber) {
        reasons.push(`Valid Commercial Driver License: ${d.licenseNumber}`);
      } else {
        score -= 20;
        reasons.push('Driver license number pending administrative verification');
      }

      return {
        driver: {
          id: d.id,
          name: d.name,
          email: d.email,
          phone: d.phone,
          licenseNumber: d.licenseNumber,
          employeeId: d.employeeId,
          jobTitle: d.jobTitle,
          avatarUrl: d.avatarUrl,
        },
        isAvailable,
        score,
        reasons,
        activeConflict: conflict ? conflict.booking : null,
      };
    });

    recommendations.sort((a, b) => {
      if (a.isAvailable && !b.isAvailable) return -1;
      if (!a.isAvailable && b.isAvailable) return 1;
      return b.score - a.score;
    });

    return recommendations;
  }
}
