import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFuelRecordDto, QueryFuelStatsDto } from './fuel.dto';

@Injectable()
export class FuelService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { vehicleId?: string; driverId?: string; dateFrom?: string; dateTo?: string }) {
    const where: any = {};
    if (query?.vehicleId) where.vehicleId = query.vehicleId;
    if (query?.driverId) where.driverId = query.driverId;

    if (query?.dateFrom || query?.dateTo) {
      where.date = {};
      if (query.dateFrom) where.date.gte = new Date(query.dateFrom);
      if (query.dateTo) where.date.lte = new Date(query.dateTo);
    }

    return this.prisma.fuelRecord.findMany({
      where,
      include: {
        vehicle: {
          select: {
            id: true,
            name: true,
            registrationNumber: true,
            category: true,
            fuelType: true,
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async getStats(query?: QueryFuelStatsDto) {
    const records = await this.findAll(query);

    if (records.length === 0) {
      return {
        hasReliableData: false,
        totalLiters: 0,
        totalCost: 0,
        averagePricePerLiter: 0,
        totalRecords: 0,
        averageCostPerKm: null,
        monthlyTrend: [],
      };
    }

    let totalLiters = 0;
    let totalCost = 0;
    let minOdometer = Infinity;
    let maxOdometer = -Infinity;

    const monthlyMap = new Map<string, { liters: number; cost: number; count: number }>();

    for (const r of records) {
      totalLiters += r.fuelQuantity;
      totalCost += r.totalCost;
      if (r.odometer < minOdometer) minOdometer = r.odometer;
      if (r.odometer > maxOdometer) maxOdometer = r.odometer;

      const monthKey = new Date(r.date).toISOString().slice(0, 7); // YYYY-MM
      const existingMonth = monthlyMap.get(monthKey) || { liters: 0, cost: 0, count: 0 };
      existingMonth.liters += r.fuelQuantity;
      existingMonth.cost += r.totalCost;
      existingMonth.count += 1;
      monthlyMap.set(monthKey, existingMonth);
    }

    const distanceTraveled = maxOdometer > minOdometer ? maxOdometer - minOdometer : 0;
    const averageCostPerKm =
      distanceTraveled > 0 ? parseFloat((totalCost / distanceTraveled).toFixed(2)) : null;

    const monthlyTrend = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        liters: parseFloat(data.liters.toFixed(1)),
        cost: parseFloat(data.cost.toFixed(2)),
        count: data.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      hasReliableData: true,
      totalLiters: parseFloat(totalLiters.toFixed(1)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      averagePricePerLiter: parseFloat((totalCost / totalLiters).toFixed(2)),
      totalRecords: records.length,
      distanceTraveledKm: distanceTraveled,
      averageCostPerKm,
      monthlyTrend,
    };
  }

  async create(dto: CreateFuelRecordDto, actorId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: dto.vehicleId },
    });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    const totalCost = dto.totalCost ?? dto.fuelQuantity * dto.unitPrice;
    const recordDate = dto.date ? new Date(dto.date) : new Date();

    // Anomaly checks (Part 8)
    const warnings: string[] = [];

    // 1. Odometer rollback check
    if (vehicle.mileage && dto.odometer < vehicle.mileage) {
      warnings.push(
        `Odometer reading (${dto.odometer} km) is lower than the recorded vehicle mileage (${vehicle.mileage} km).`,
      );
    }

    // 2. Duplicate receipt reference check
    if (dto.receiptReference) {
      const duplicateReceipt = await this.prisma.fuelRecord.findFirst({
        where: { receiptReference: dto.receiptReference.trim() },
      });
      if (duplicateReceipt) {
        warnings.push(`Receipt reference "${dto.receiptReference}" has already been logged.`);
      }
    }

    // 3. Unusually large fuel quantity check
    if (dto.fuelQuantity > 160) {
      warnings.push(`Unusually high fuel volume (${dto.fuelQuantity} L) for vehicle tank capacity.`);
    }

    const record = await this.prisma.fuelRecord.create({
      data: {
        vehicleId: dto.vehicleId,
        driverId: dto.driverId || null,
        date: recordDate,
        odometer: dto.odometer,
        fuelQuantity: dto.fuelQuantity,
        unitPrice: dto.unitPrice,
        totalCost,
        fuelStation: dto.fuelStation || null,
        receiptReference: dto.receiptReference ? dto.receiptReference.trim() : null,
        notes: dto.notes || null,
      },
      include: {
        vehicle: true,
        driver: true,
      },
    });

    // Update vehicle mileage if higher
    if (!vehicle.mileage || dto.odometer > vehicle.mileage) {
      await this.prisma.vehicle.update({
        where: { id: dto.vehicleId },
        data: { mileage: dto.odometer },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        actorId,
        actorName: 'Fleet Officer',
        action: 'CREATE_FUEL_RECORD',
        entityType: 'FUEL_RECORD',
        entityId: record.id,
        newValues: {
          vehicleReg: vehicle.registrationNumber,
          fuelQuantity: record.fuelQuantity,
          totalCost: record.totalCost,
          receiptReference: record.receiptReference,
          warnings: warnings.length > 0 ? warnings : undefined,
        },
      },
    });

    return {
      record,
      warnings: warnings.length > 0 ? warnings : null,
    };
  }
}
