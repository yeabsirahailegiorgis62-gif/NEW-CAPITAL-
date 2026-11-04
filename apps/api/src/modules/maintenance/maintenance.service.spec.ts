import { Test, TestingModule } from '@nestjs/testing';
import { MaintenanceService } from './maintenance.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { VehicleOperationalStatus } from '@prisma/client';

describe('MaintenanceService', () => {
  let service: MaintenanceService;
  let prisma: PrismaService;

  const mockVehicle = {
    id: 'veh-1',
    name: 'Ford Ranger',
    make: 'Ford',
    model: 'Ranger',
    registrationNumber: 'AA-3-B99999',
    mileage: 45000,
    operationalStatus: VehicleOperationalStatus.ACTIVE,
  };

  const mockRecord = {
    id: 'maint-1',
    vehicleId: 'veh-1',
    category: 'PREVENTIVE',
    status: 'SCHEDULED',
    serviceDescription: 'Oil and filter replacement',
    serviceDate: new Date('2026-11-10'),
    estimatedCost: 3500,
    actualCost: null,
    vehicle: mockVehicle,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaintenanceService,
        {
          provide: PrismaService,
          useValue: {
            vehicleMaintenance: {
              findMany: jest.fn().mockResolvedValue([mockRecord]),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            vehicle: {
              findUnique: jest.fn(),
              findMany: jest.fn().mockResolvedValue([mockVehicle]),
              update: jest.fn(),
            },
            vehicleIssue: {
              findMany: jest.fn().mockResolvedValue([]),
            },
            auditLog: {
              create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
            },
          },
        },
      ],
    }).compile();

    service = module.get<MaintenanceService>(MaintenanceService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return maintenance logs with associated vehicle data', async () => {
      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0].serviceDescription).toBe('Oil and filter replacement');
      expect(result[0].vehicle.registrationNumber).toBe('AA-3-B99999');
    });

    it('should apply status and vehicleId filters when supplied', async () => {
      await service.findAll({ vehicleId: 'veh-1', status: 'SCHEDULED' });
      expect(prisma.vehicleMaintenance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { vehicleId: 'veh-1', status: 'SCHEDULED' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return maintenance record by id', async () => {
      jest.spyOn(prisma.vehicleMaintenance, 'findUnique').mockResolvedValue(mockRecord as any);

      const result = await service.findOne('maint-1');
      expect(result.id).toBe('maint-1');
      expect(result.serviceDescription).toBe('Oil and filter replacement');
    });

    it('should throw NotFoundException if maintenance record is not found', async () => {
      jest.spyOn(prisma.vehicleMaintenance, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create maintenance record and link to vehicle', async () => {
      jest.spyOn(prisma.vehicle, 'findUnique').mockResolvedValue(mockVehicle as any);
      jest.spyOn(prisma.vehicleMaintenance, 'create').mockResolvedValue(mockRecord as any);

      const result = await service.create(
        {
          vehicleId: 'veh-1',
          serviceDescription: 'Oil and filter replacement',
          serviceDate: '2026-11-10T08:00:00Z',
          category: 'PREVENTIVE',
          status: 'SCHEDULED',
          estimatedCost: 3500,
        },
        'user-admin',
      );

      expect(result.id).toBe('maint-1');
      expect(prisma.vehicleMaintenance.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if target vehicle does not exist', async () => {
      jest.spyOn(prisma.vehicle, 'findUnique').mockResolvedValue(null);

      await expect(
        service.create(
          {
            vehicleId: 'non-existent',
            serviceDescription: 'Brake inspection',
            serviceDate: '2026-11-10T08:00:00Z',
          },
          'user-admin',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove maintenance record by id and audit log the deletion', async () => {
      jest.spyOn(prisma.vehicleMaintenance, 'findUnique').mockResolvedValue(mockRecord as any);
      jest.spyOn(prisma.vehicleMaintenance, 'delete').mockResolvedValue(mockRecord as any);

      const result = await service.remove('maint-1', 'user-admin');
      expect(result.success).toBe(true);
      expect(prisma.vehicleMaintenance.delete).toHaveBeenCalledWith({ where: { id: 'maint-1' } });
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });
  });
});
