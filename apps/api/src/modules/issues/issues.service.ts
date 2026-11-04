// SERVICE: Defect reporting; may set a vehicle to MAINTENANCE when safety is flagged.
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIssueDto, UpdateIssueDto } from './issues.dto';
import { IssueStatus, VehicleOperationalStatus, BookingStatus, UserRole } from '@prisma/client';

@Injectable()
export class IssuesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { status?: IssueStatus; vehicleId?: string }) {
    const where: any = {};
    if (query?.status) where.status = query.status;
    if (query?.vehicleId) where.vehicleId = query.vehicleId;

    return this.prisma.vehicleIssue.findMany({
      where,
      include: {
        vehicle: true,
        reportedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { reportedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const issue = await this.prisma.vehicleIssue.findUnique({
      where: { id },
      include: {
        vehicle: true,
        reportedBy: { select: { id: true, name: true, email: true } },
      },
    });
    if (!issue) throw new NotFoundException('Vehicle issue record not found');
    return issue;
  }

  async create(reporter: any, dto: CreateIssueDto) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    const isSafetyConcern = Boolean(dto.immediateSafetyConcern);

    const issue = await this.prisma.vehicleIssue.create({
      data: {
        vehicleId: dto.vehicleId,
        reportedById: reporter.id,
        category: dto.category || 'MECHANICAL',
        description: dto.description,
        severity: dto.severity || 'MEDIUM',
        status: IssueStatus.OPEN,
        odometer: dto.odometer || vehicle.mileage || null,
        immediateSafetyConcern: isSafetyConcern,
        photoUrl: dto.photoUrl || null,
      },
      include: { vehicle: true, reportedBy: true },
    });

    // If marked for maintenance OR flagged as immediate safety concern, update vehicle status
    let affectedBookings: any[] = [];
    const shouldHaltVehicle = dto.setMaintenanceStatus || isSafetyConcern;

    if (shouldHaltVehicle) {
      await this.prisma.vehicle.update({
        where: { id: dto.vehicleId },
        data: {
          operationalStatus: VehicleOperationalStatus.MAINTENANCE,
          hasSafetyAlert: isSafetyConcern ? true : vehicle.hasSafetyAlert,
        },
      });

      // Find upcoming active assignments that will be impacted by maintenance!
      const now = new Date();
      const assignments = await this.prisma.vehicleAssignment.findMany({
        where: {
          vehicleId: dto.vehicleId,
          unassignedAt: null,
          booking: {
            status: { in: [BookingStatus.ASSIGNED, BookingStatus.APPROVED] },
            expectedReturnAt: { gte: now },
          },
        },
        include: {
          booking: {
            include: { requester: true },
          },
        },
      });

      affectedBookings = assignments.map((a) => a.booking);

      // Notify logistics admins of immediate safety concern
      const logisticsAdmins = await this.prisma.user.findMany({
        where: { role: { in: [UserRole.LOGISTICS_ADMIN, UserRole.SYSTEM_ADMIN] }, isActive: true },
      });

      for (const admin of logisticsAdmins) {
        await this.prisma.notification.create({
          data: {
            recipientId: admin.id,
            type: isSafetyConcern ? 'WARNING' : 'INFO',
            title: isSafetyConcern
              ? `CRITICAL SAFETY ALERT: ${vehicle.registrationNumber}`
              : `Vehicle Issue Logged: ${vehicle.registrationNumber}`,
            message: `${reporter.name || 'Staff'} reported: ${dto.description}. Vehicle placed in maintenance workshop lock.`,
          },
        });
      }
    }

    return {
      issue,
      maintenanceSet: shouldHaltVehicle,
      affectedBookings,
    };
  }

  async update(id: string, dto: UpdateIssueDto) {
    const existing = await this.findOne(id);

    const isResolving = dto.status === IssueStatus.RESOLVED;

    const updated = await this.prisma.vehicleIssue.update({
      where: { id },
      data: {
        status: dto.status,
        resolutionNotes: dto.resolutionNotes,
        resolvedAt: isResolving ? new Date() : undefined,
      },
      include: { vehicle: true },
    });

    // If resolved, check if vehicle has any other open safety concerns or issues
    if (isResolving) {
      const remainingUnresolved = await this.prisma.vehicleIssue.findMany({
        where: {
          vehicleId: existing.vehicleId,
          status: { in: [IssueStatus.OPEN, IssueStatus.IN_REVIEW] },
          id: { not: id },
        },
      });

      const hasRemainingSafetyConcern = remainingUnresolved.some((i) => i.immediateSafetyConcern);
      const vehicleUpdate: any = {};

      if (!hasRemainingSafetyConcern && updated.vehicle.hasSafetyAlert) {
        vehicleUpdate.hasSafetyAlert = false;
      }

      if (remainingUnresolved.length === 0 && updated.vehicle.operationalStatus === VehicleOperationalStatus.MAINTENANCE) {
        // Return vehicle to ACTIVE status
        vehicleUpdate.operationalStatus = VehicleOperationalStatus.ACTIVE;
      }

      if (Object.keys(vehicleUpdate).length > 0) {
        await this.prisma.vehicle.update({
          where: { id: existing.vehicleId },
          data: vehicleUpdate,
        });
      }
    }

    return updated;
  }
}
