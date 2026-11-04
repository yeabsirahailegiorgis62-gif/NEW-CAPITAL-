// SERVICE: Fleet inventory plus overlap detection used during vehicle/driver assignment.
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVehicleDto, UpdateVehicleDto } from './vehicles.dto';
import { VehicleCategory, VehicleOperationalStatus, BookingStatus, UserRole } from '@prisma/client';

export function getSlotInterval(tripDate: Date | string, timeSlot?: string | null): { start: Date; end: Date } {
  const d = new Date(tripDate);
  const y = d.getFullYear();
  const m = d.getMonth();
  const day = d.getDate();
  const slot = (timeSlot || '').toUpperCase();

  if (slot === 'MORNING') {
    return {
      start: new Date(y, m, day, 8, 0, 0),
      end: new Date(y, m, day, 12, 30, 0),
    };
  } else if (slot === 'AFTERNOON') {
    return {
      start: new Date(y, m, day, 13, 0, 0),
      end: new Date(y, m, day, 18, 0, 0),
    };
  } else {
    return {
      start: new Date(y, m, day, 0, 0, 0),
      end: new Date(y, m, day, 23, 59, 59, 999),
    };
  }
}

export function intervalsOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
  return start1.getTime() < end2.getTime() && end1.getTime() > start2.getTime();
}

export function doesAssignmentConflict(
  asgn: any,
  depDate: Date,
  retDate: Date,
  targetBookingDays?: Array<{ tripDate: Date | string; timeSlot?: string }>
): boolean {
  const otherBooking = asgn.booking;
  if (!otherBooking) return false;
  const otherHasDays = otherBooking.bookingDays && otherBooking.bookingDays.length > 0;
  const targetHasDays = targetBookingDays && targetBookingDays.length > 0;

  if (targetHasDays && otherHasDays) {
    for (const reqDay of targetBookingDays) {
      const reqInterval = getSlotInterval(reqDay.tripDate, reqDay.timeSlot);
      for (const otherDay of otherBooking.bookingDays) {
        if (otherDay.status === 'CANCELLED') continue;
        const otherInterval = getSlotInterval(otherDay.tripDate, otherDay.timeSlot);
        if (intervalsOverlap(reqInterval.start, reqInterval.end, otherInterval.start, otherInterval.end)) {
          return true;
        }
      }
    }
    return false;
  }

  if (targetHasDays && !otherHasDays) {
    const otherDep = new Date(otherBooking.departureAt);
    const otherRet = new Date(otherBooking.expectedReturnAt);
    for (const reqDay of targetBookingDays) {
      const reqInterval = getSlotInterval(reqDay.tripDate, reqDay.timeSlot);
      if (intervalsOverlap(reqInterval.start, reqInterval.end, otherDep, otherRet)) {
        return true;
      }
    }
    return false;
  }

  if (!targetHasDays && otherHasDays) {
    for (const otherDay of otherBooking.bookingDays) {
      if (otherDay.status === 'CANCELLED') continue;
      const otherInterval = getSlotInterval(otherDay.tripDate, otherDay.timeSlot);
      if (intervalsOverlap(depDate, retDate, otherInterval.start, otherInterval.end)) {
        return true;
      }
    }
    return false;
  }

  const otherDep = new Date(otherBooking.departureAt);
  const otherRet = new Date(otherBooking.expectedReturnAt);
  return intervalsOverlap(depDate, retDate, otherDep, otherRet);
}

export function doesBookingDayConflict(
  bd: any,
  depDate: Date,
  retDate: Date,
  targetBookingDays?: Array<{ tripDate: Date | string; timeSlot?: string }>
): boolean {
  if (bd.status === 'CANCELLED') return false;
  const bdInterval = getSlotInterval(bd.tripDate, bd.timeSlot);

  if (targetBookingDays && targetBookingDays.length > 0) {
    for (const reqDay of targetBookingDays) {
      const reqInterval = getSlotInterval(reqDay.tripDate, reqDay.timeSlot);
      if (intervalsOverlap(reqInterval.start, reqInterval.end, bdInterval.start, bdInterval.end)) {
        return true;
      }
    }
    return false;
  }

  return intervalsOverlap(depDate, retDate, bdInterval.start, bdInterval.end);
}

@Injectable()
export class VehiclesService {
  // DEPENDENCY INJECTION: PrismaService for vehicle, assignment, and driver queries.
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
  async getAvailability(departureAt: Date | string, expectedReturnAt: Date | string, minCapacity?: number, category?: VehicleCategory) {
    const depDate = new Date(departureAt);
    const retDate = new Date(expectedReturnAt);

    const where: any = {};
    if (minCapacity) {
      where.passengerCapacity = { gte: minCapacity };
    }
    if (category) {
      where.category = category;
    }

    const startOfRange = new Date(depDate.getFullYear(), depDate.getMonth(), depDate.getDate(), 0, 0, 0);
    const endOfRange = new Date(retDate.getFullYear(), retDate.getMonth(), retDate.getDate(), 23, 59, 59, 999);

    const vehicles = await this.prisma.vehicle.findMany({
      where,
      include: {
        assignments: {
          where: {
            unassignedAt: null,
            booking: {
              status: { in: [BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS] },
              departureAt: { lt: retDate },
              expectedReturnAt: { gt: depDate },
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
                bookingDays: true,
              },
            },
          },
        },
        bookingDays: {
          where: {
            status: { in: [BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS, BookingStatus.APPROVED] },
            tripDate: {
              gte: startOfRange,
              lte: endOfRange,
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
        maintenances: {
          where: {
            status: { in: ['SCHEDULED', 'IN_PROGRESS', 'REPORTED'] },
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
      const assignmentConflict = v.assignments.find((a) => doesAssignmentConflict(a, depDate, retDate)) || null;

      // Slot-precise check for bookingDays
      const dayConflict = v.bookingDays.find((bd) => doesBookingDayConflict(bd, depDate, retDate)) || null;

      const overlappingConflict = assignmentConflict?.booking || dayConflict?.booking || null;

      // Check maintenance
      let maintenanceConflictReason = '';
      if (v.operationalStatus === VehicleOperationalStatus.MAINTENANCE) {
        maintenanceConflictReason = 'Vehicle is currently in workshop maintenance';
      } else {
        const mConflict = v.maintenances.find((m) => {
          if (m.status === 'IN_PROGRESS') return true;
          const mStart = new Date(m.serviceDate.getFullYear(), m.serviceDate.getMonth(), m.serviceDate.getDate(), 0, 0, 0);
          const mEnd = m.completedDate
            ? new Date(m.completedDate)
            : new Date(m.serviceDate.getFullYear(), m.serviceDate.getMonth(), m.serviceDate.getDate(), 23, 59, 59, 999);
          return intervalsOverlap(depDate, retDate, mStart, mEnd);
        });
        if (mConflict) {
          maintenanceConflictReason = `Vehicle is scheduled for workshop maintenance on ${new Date(mConflict.serviceDate).toLocaleDateString('en-GB')} (${mConflict.category})`;
        }
      }

      const isAvailable = isOperational && !maintenanceConflictReason && !overlappingConflict;

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
      } else if (maintenanceConflictReason) {
        reason = maintenanceConflictReason;
      } else if (overlappingConflict) {
        reason = `Currently assigned to mission #${overlappingConflict.bookingReference} (${overlappingConflict.destination})`;
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
        activeBookingConflict: overlappingConflict,
      };
    });
  }

  /**
   * Intelligent Vehicle Recommendation Engine (Part 3)
   */
  async getRecommendations(params: {
    departureAt: Date | string;
    expectedReturnAt: Date | string;
    passengerCount: number;
    category?: VehicleCategory;
    preferredVehicleId?: string;
    excludeBookingId?: string;
    bookingDays?: Array<{ tripDate: Date | string; timeSlot?: string; dayOfWeek?: string }>;
  }) {
    const { departureAt, expectedReturnAt, passengerCount, category, preferredVehicleId, excludeBookingId, bookingDays } = params;

    const depDate = new Date(departureAt);
    const retDate = new Date(expectedReturnAt);
    const startOfRange = new Date(depDate.getFullYear(), depDate.getMonth(), depDate.getDate(), 0, 0, 0);
    const endOfRange = new Date(retDate.getFullYear(), retDate.getMonth(), retDate.getDate(), 23, 59, 59, 999);

    const allVehicles = await this.prisma.vehicle.findMany({
      include: {
        assignments: {
          where: {
            unassignedAt: null,
            booking: {
              ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
              status: { in: [BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS] },
              departureAt: { lt: retDate },
              expectedReturnAt: { gt: depDate },
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
                bookingDays: true,
              },
            },
          },
        },
        bookingDays: {
          where: {
            ...(excludeBookingId ? { bookingId: { not: excludeBookingId } } : {}),
            status: { in: [BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS, BookingStatus.APPROVED] },
            tripDate: {
              gte: startOfRange,
              lte: endOfRange,
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
        maintenances: {
          where: {
            status: { in: ['SCHEDULED', 'IN_PROGRESS', 'REPORTED'] },
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

      // 4. Maintenance check
      let maintenanceConflict = false;
      let maintenanceReason = '';
      if (v.operationalStatus === VehicleOperationalStatus.MAINTENANCE) {
        maintenanceConflict = true;
        maintenanceReason = 'Vehicle is currently in workshop maintenance';
      } else {
        const mConflict = v.maintenances.find((m) => {
          if (m.status === 'IN_PROGRESS') return true;
          const mStart = new Date(m.serviceDate.getFullYear(), m.serviceDate.getMonth(), m.serviceDate.getDate(), 0, 0, 0);
          const mEnd = m.completedDate
            ? new Date(m.completedDate)
            : new Date(m.serviceDate.getFullYear(), m.serviceDate.getMonth(), m.serviceDate.getDate(), 23, 59, 59, 999);
          if (bookingDays && bookingDays.length > 0) {
            return bookingDays.some((reqDay) => {
              const reqInterval = getSlotInterval(reqDay.tripDate, reqDay.timeSlot);
              return intervalsOverlap(mStart, mEnd, reqInterval.start, reqInterval.end);
            });
          }
          return intervalsOverlap(depDate, retDate, mStart, mEnd);
        });
        if (mConflict) {
          maintenanceConflict = true;
          maintenanceReason = `Vehicle is scheduled for workshop maintenance on ${new Date(mConflict.serviceDate).toLocaleDateString('en-GB')} (${mConflict.category})`;
        }
      }

      if (maintenanceConflict) {
        isEligible = false;
        score = 0;
        reasons.push(maintenanceReason);
      }

      // 5. Scheduling overlap check with time slot precision
      const assignmentConflict = v.assignments.find((a) =>
        doesAssignmentConflict(a, depDate, retDate, bookingDays)
      ) || null;

      const dayConflict = v.bookingDays.find((bd) =>
        doesBookingDayConflict(bd, depDate, retDate, bookingDays)
      ) || null;

      const conflict = assignmentConflict?.booking || dayConflict?.booking || null;

      if (conflict) {
        isEligible = false;
        score = 0;
        reasons.push(`Scheduling conflict with booking ${conflict.bookingReference} (${conflict.destination})`);
      } else if (!maintenanceConflict) {
        reasons.push('No scheduling conflict for requested timeframe');
      }

      // 6. Preferred vehicle bonus
      if (preferredVehicleId && v.id === preferredVehicleId) {
        score += 15;
        reasons.push('Requested as preferred vehicle by employee');
      }

      // 7. Category preference bonus
      if (category && v.category === category) {
        score += 10;
        reasons.push(`Matches requested category (${category})`);
      }

      // 8. Open issues count penalty
      if (v.issues.length > 0) {
        score -= v.issues.length * 5;
        reasons.push(`${v.issues.length} minor non-critical open maintenance note(s)`);
      }

      const isActuallyAvailable = isEligible && !conflict && !maintenanceConflict;

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
        isAvailable: isActuallyAvailable,
        isCapacitySuitable: v.passengerCapacity >= (passengerCount || 1),
        reasons,
        conflict: conflict || null,
        conflictDetails: conflict
          ? {
              bookingReference: conflict.bookingReference,
              destination: conflict.destination,
              departureAt: conflict.departureAt,
              expectedReturnAt: conflict.expectedReturnAt,
            }
          : null,
      };
    });

    // Sort: eligible and available first, then by score descending
    recommendations.sort((a, b) => {
      if (a.isAvailable && !b.isAvailable) return -1;
      if (!a.isAvailable && b.isAvailable) return 1;
      if (a.isEligible && !b.isEligible) return -1;
      if (!a.isEligible && b.isEligible) return 1;
      return b.score - a.score;
    });

    return recommendations;
  }

  /**
   * Fetch vehicle recommendations directly for a specific booking
   */
  async getRecommendationsForBooking(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        bookingDays: true,
      },
    });
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found.`);
    }
    return this.getRecommendations({
      departureAt: booking.departureAt,
      expectedReturnAt: booking.expectedReturnAt,
      passengerCount: booking.passengerCount,
      preferredVehicleId: booking.preferredVehicleId || undefined,
      excludeBookingId: booking.id,
      bookingDays: booking.bookingDays,
    });
  }

  /**
   * Driver Recommendation Engine (Part 3)
   */
  async getDriverRecommendations(
    departureAt: Date | string,
    expectedReturnAt: Date | string,
    excludeBookingId?: string,
    bookingDays?: Array<{ tripDate: Date | string; timeSlot?: string; dayOfWeek?: string }>
  ) {
    const depDate = new Date(departureAt);
    const retDate = new Date(expectedReturnAt);
    const startOfRange = new Date(depDate.getFullYear(), depDate.getMonth(), depDate.getDate(), 0, 0, 0);
    const endOfRange = new Date(retDate.getFullYear(), retDate.getMonth(), retDate.getDate(), 23, 59, 59, 999);

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
              ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
              status: { in: [BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS] },
              departureAt: { lt: retDate },
              expectedReturnAt: { gt: depDate },
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
                bookingDays: true,
              },
            },
          },
        },
        driverBookingDays: {
          where: {
            ...(excludeBookingId ? { bookingId: { not: excludeBookingId } } : {}),
            status: { in: [BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS, BookingStatus.APPROVED] },
            tripDate: {
              gte: startOfRange,
              lte: endOfRange,
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

    // Read system settings for driver assignment policies
    const settingsRecords = await this.prisma.systemSetting.findMany();
    const settingsMap = new Map<string, any>();
    settingsRecords.forEach((s) => {
      try {
        settingsMap.set(s.key, JSON.parse(s.value));
      } catch {
        settingsMap.set(s.key, s.value);
      }
    });
    const requireValidLicense = settingsMap.get('requireValidDriverLicense') ?? true;

    const recommendations = drivers.map((d) => {
      let isAvailable = true;
      let score = 100;
      const reasons: string[] = [];

      const assignmentConflict = d.driverAssignments.find((a) =>
        doesAssignmentConflict(a, depDate, retDate, bookingDays)
      ) || null;

      const dayConflict = d.driverBookingDays.find((bd) =>
        doesBookingDayConflict(bd, depDate, retDate, bookingDays)
      ) || null;

      const conflict = assignmentConflict?.booking || dayConflict?.booking || null;

      if (conflict) {
        isAvailable = false;
        score = 0;
        reasons.push(`Assigned to concurrent mission #${conflict.bookingReference} (${conflict.destination})`);
      } else {
        reasons.push('Available for trip interval with zero overlapping assignments');
      }

      if (d.licenseNumber && d.licenseNumber.trim()) {
        reasons.push(`Valid Commercial Driver License: ${d.licenseNumber}`);
      } else {
        if (requireValidLicense) {
          isAvailable = false;
          score = Math.min(score, 10);
          reasons.push('Ineligible: Commercial driver license verification required by company policy');
        } else {
          score -= 20;
          reasons.push('Driver license number pending administrative verification');
        }
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
        activeConflict: conflict || null,
      };
    });

    recommendations.sort((a, b) => {
      if (a.isAvailable && !b.isAvailable) return -1;
      if (!a.isAvailable && b.isAvailable) return 1;
      return b.score - a.score;
    });

    return recommendations;
  }

  /**
   * Fetch driver recommendations directly for a specific booking
   */
  async getDriverRecommendationsForBooking(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        bookingDays: true,
      },
    });
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found.`);
    }
    return this.getDriverRecommendations(
      booking.departureAt,
      booking.expectedReturnAt,
      booking.id,
      booking.bookingDays,
    );
  }
}
