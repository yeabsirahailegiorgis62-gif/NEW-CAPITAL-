// SERVICE: Workshop jobs linked to Vehicle via vehicleId.
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMaintenanceDto, UpdateMaintenanceDto } from './maintenance.dto';
import { VehicleOperationalStatus } from '@prisma/client';

@Injectable()
export class MaintenanceService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { vehicleId?: string; status?: string; category?: string }) {
    const where: any = {};
    if (query?.vehicleId) where.vehicleId = query.vehicleId;
    if (query?.status) where.status = query.status;
    if (query?.category) where.category = query.category;

    return this.prisma.vehicleMaintenance.findMany({
      where,
      include: {
        vehicle: {
          select: {
            id: true,
            name: true,
            make: true,
            model: true,
            registrationNumber: true,
            mileage: true,
            operationalStatus: true,
          },
        },
      },
      orderBy: { serviceDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const record = await this.prisma.vehicleMaintenance.findUnique({
      where: { id },
      include: {
        vehicle: true,
      },
    });
    if (!record) throw new NotFoundException('Maintenance record not found');
    return record;
  }

  async getOverview() {
    const now = new Date();
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const allVehicles = await this.prisma.vehicle.findMany({
      select: {
        id: true,
        name: true,
        make: true,
        model: true,
        registrationNumber: true,
        mileage: true,
        operationalStatus: true,
        hasSafetyAlert: true,
        lastMaintenanceDate: true,
        nextMaintenanceDate: true,
        nextMaintenanceOdometer: true,
        inspectionExpiry: true,
        insuranceExpiry: true,
      },
    });

    const activeWorkshopCount = allVehicles.filter(
      (v) => v.operationalStatus === VehicleOperationalStatus.MAINTENANCE,
    ).length;

    const overdueVehicles: any[] = [];
    const dueSoonVehicles: any[] = [];
    const upcomingInspections: any[] = [];
    const upcomingInsurance: any[] = [];

    for (const v of allVehicles) {
      const currentMileage = v.mileage || 0;
      let isOverdue = false;
      let isDueSoon = false;

      // Check date-based maintenance
      if (v.nextMaintenanceDate) {
        if (v.nextMaintenanceDate < now) {
          isOverdue = true;
        } else if (v.nextMaintenanceDate <= thirtyDaysFromNow) {
          isDueSoon = true;
        }
      }

      // Check odometer-based maintenance
      if (v.nextMaintenanceOdometer) {
        if (currentMileage >= v.nextMaintenanceOdometer) {
          isOverdue = true;
        } else if (v.nextMaintenanceOdometer - currentMileage <= 1000) {
          isDueSoon = true;
        }
      }

      if (isOverdue) overdueVehicles.push(v);
      else if (isDueSoon) dueSoonVehicles.push(v);

      if (v.inspectionExpiry && v.inspectionExpiry <= thirtyDaysFromNow) {
        upcomingInspections.push(v);
      }
      if (v.insuranceExpiry && v.insuranceExpiry <= thirtyDaysFromNow) {
        upcomingInsurance.push(v);
      }
    }

    const recentRecords = await this.prisma.vehicleMaintenance.findMany({
      include: {
        vehicle: {
          select: {
            id: true,
            name: true,
            registrationNumber: true,
          },
        },
      },
      orderBy: { serviceDate: 'desc' },
      take: 6,
    });

    return {
      activeWorkshopCount,
      overdueCount: overdueVehicles.length,
      dueSoonCount: dueSoonVehicles.length,
      upcomingInspectionsCount: upcomingInspections.length,
      upcomingInsuranceCount: upcomingInsurance.length,
      overdueVehicles,
      dueSoonVehicles,
      upcomingInspections,
      upcomingInsurance,
      recentRecords,
    };
  }

  async create(dto: CreateMaintenanceDto, actorId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: dto.vehicleId },
    });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    const serviceDate = new Date(dto.serviceDate);

    const record = await this.prisma.vehicleMaintenance.create({
      data: {
        vehicleId: dto.vehicleId,
        category: dto.category || 'PREVENTIVE',
        status: dto.status || 'SCHEDULED',
        reportedProblem: dto.reportedProblem || null,
        serviceDescription: dto.serviceDescription,
        serviceDate,
        completedDate: dto.completedDate ? new Date(dto.completedDate) : null,
        odometer: dto.odometer || vehicle.mileage || null,
        serviceProvider: dto.serviceProvider || null,
        estimatedCost: dto.estimatedCost || null,
        actualCost: dto.actualCost || null,
        nextServiceDate: dto.nextServiceDate ? new Date(dto.nextServiceDate) : null,
        nextServiceOdometer: dto.nextServiceOdometer || null,
        notes: dto.notes || null,
        documentUrl: dto.documentUrl || null,
      },
      include: {
        vehicle: true,
      },
    });

    // Optionally set vehicle to MAINTENANCE status if requested or in progress
    const shouldSetMaintenance =
      dto.transitionVehicleToMaintenance || dto.status === 'IN_PROGRESS';

    const vehicleUpdate: any = {};
    if (shouldSetMaintenance) {
      vehicleUpdate.operationalStatus = VehicleOperationalStatus.MAINTENANCE;
    }
    if (dto.nextServiceDate) {
      vehicleUpdate.nextMaintenanceDate = new Date(dto.nextServiceDate);
    }
    if (dto.nextServiceOdometer) {
      vehicleUpdate.nextMaintenanceOdometer = dto.nextServiceOdometer;
    }

    if (Object.keys(vehicleUpdate).length > 0) {
      await this.prisma.vehicle.update({
        where: { id: dto.vehicleId },
        data: vehicleUpdate,
      });
    }

    await this.prisma.auditLog.create({
      data: {
        actorId,
        actorName: 'Logistics Officer',
        action: 'CREATE_VEHICLE_MAINTENANCE',
        entityType: 'VEHICLE_MAINTENANCE',
        entityId: record.id,
        newValues: {
          vehicleReg: vehicle.registrationNumber,
          category: record.category,
          serviceDescription: record.serviceDescription,
        },
      },
    });

    return record;
  }

  async update(id: string, dto: UpdateMaintenanceDto, actorId: string) {
    const existing = await this.findOne(id);

    const data: any = { ...dto };
    if (dto.serviceDate) data.serviceDate = new Date(dto.serviceDate);
    if (dto.completedDate) data.completedDate = new Date(dto.completedDate);
    if (dto.nextServiceDate) data.nextServiceDate = new Date(dto.nextServiceDate);

    // If marking completed and no completedDate sent, set to now
    if (dto.status === 'COMPLETED' && !dto.completedDate) {
      data.completedDate = new Date();
    }

    const updated = await this.prisma.vehicleMaintenance.update({
      where: { id },
      data,
      include: { vehicle: true },
    });

    // If marked completed, update vehicle's last maintenance date and return operational status to ACTIVE if it was in MAINTENANCE
    if (dto.status === 'COMPLETED') {
      const vUpdate: any = {
        lastMaintenanceDate: updated.serviceDate,
      };
      if (updated.vehicle.operationalStatus === VehicleOperationalStatus.MAINTENANCE) {
        vUpdate.operationalStatus = VehicleOperationalStatus.ACTIVE;
      }
      if (dto.nextServiceDate) {
        vUpdate.nextMaintenanceDate = new Date(dto.nextServiceDate);
      }
      if (dto.nextServiceOdometer) {
        vUpdate.nextMaintenanceOdometer = dto.nextServiceOdometer;
      }

      await this.prisma.vehicle.update({
        where: { id: updated.vehicleId },
        data: vUpdate,
      });
    }

    await this.prisma.auditLog.create({
      data: {
        actorId,
        actorName: 'Logistics Officer',
        action: 'UPDATE_VEHICLE_MAINTENANCE',
        entityType: 'VEHICLE_MAINTENANCE',
        entityId: updated.id,
        previousValues: { status: existing.status },
        newValues: { status: updated.status },
      },
    });

    return updated;
  }

  async remove(id: string, actorId: string) {
    const existing = await this.findOne(id);
    await this.prisma.vehicleMaintenance.delete({ where: { id } });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        actorName: 'Logistics Officer',
        action: 'DELETE_VEHICLE_MAINTENANCE',
        entityType: 'VEHICLE_MAINTENANCE',
        entityId: id,
        previousValues: {
          vehicleId: existing.vehicleId,
          serviceDescription: existing.serviceDescription,
        },
      },
    });

    return { success: true, message: 'Maintenance record removed' };
  }
}
