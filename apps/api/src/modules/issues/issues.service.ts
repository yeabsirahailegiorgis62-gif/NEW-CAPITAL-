import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIssueDto, UpdateIssueDto } from './issues.dto';
import { IssueStatus, VehicleOperationalStatus, BookingStatus } from '@prisma/client';

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

    const issue = await this.prisma.vehicleIssue.create({
      data: {
        vehicleId: dto.vehicleId,
        reportedById: reporter.id,
        description: dto.description,
        severity: dto.severity,
        status: IssueStatus.OPEN,
      },
      include: { vehicle: true, reportedBy: true },
    });

    // If marked for maintenance, update vehicle status and detect affected bookings
    let affectedBookings: any[] = [];
    if (dto.setMaintenanceStatus) {
      await this.prisma.vehicle.update({
        where: { id: dto.vehicleId },
        data: { operationalStatus: VehicleOperationalStatus.MAINTENANCE },
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
    }

    return {
      issue,
      maintenanceSet: !!dto.setMaintenanceStatus,
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

    // If resolved, check if vehicle has any other open issues
    if (isResolving) {
      const remainingIssues = await this.prisma.vehicleIssue.count({
        where: {
          vehicleId: existing.vehicleId,
          status: { in: [IssueStatus.OPEN, IssueStatus.IN_REVIEW] },
          id: { not: id },
        },
      });

      if (remainingIssues === 0 && updated.vehicle.operationalStatus === VehicleOperationalStatus.MAINTENANCE) {
        // Return vehicle to ACTIVE status
        await this.prisma.vehicle.update({
          where: { id: existing.vehicleId },
          data: { operationalStatus: VehicleOperationalStatus.ACTIVE },
        });
      }
    }

    return updated;
  }
}
