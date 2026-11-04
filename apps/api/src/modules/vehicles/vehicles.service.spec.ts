import { Test, TestingModule } from '@nestjs/testing';
import {
  VehiclesService,
  getSlotInterval,
  intervalsOverlap,
} from './vehicles.service';
import { PrismaService } from '../../prisma/prisma.service';
import { VehicleCategory, VehicleOperationalStatus } from '@prisma/client';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('VehiclesService', () => {
  let service: VehiclesService;
  let prisma: PrismaService;

  const mockVehicle = {
    id: 'veh-1',
    name: 'Toyota Land Cruiser',
    make: 'Toyota',
    model: 'Land Cruiser',
    registrationNumber: 'AA-3-A12345',
    category: VehicleCategory.SUV,
    passengerCapacity: 7,
    operationalStatus: VehicleOperationalStatus.ACTIVE,
    fuelLevel: 90,
    mileage: 25000,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        {
          provide: PrismaService,
          useValue: {
            vehicle: {
              findMany: jest.fn().mockResolvedValue([mockVehicle]),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            vehicleAssignment: {
              findMany: jest.fn().mockResolvedValue([]),
            },
            bookingDay: {
              findMany: jest.fn().mockResolvedValue([]),
            },
            user: {
              findMany: jest.fn().mockResolvedValue([]),
            },
            booking: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Interval & Overlap Helpers', () => {
    it('should calculate MORNING slot interval between 08:00 and 12:30', () => {
      const interval = getSlotInterval('2026-11-05', 'MORNING');
      expect(interval.start.getHours()).toBe(8);
      expect(interval.end.getHours()).toBe(12);
      expect(interval.end.getMinutes()).toBe(30);
    });

    it('should calculate AFTERNOON slot interval between 13:00 and 18:00', () => {
      const interval = getSlotInterval('2026-11-05', 'AFTERNOON');
      expect(interval.start.getHours()).toBe(13);
      expect(interval.end.getHours()).toBe(18);
    });

    it('should detect overlapping time intervals accurately', () => {
      const t1 = new Date('2026-11-05T08:00:00Z');
      const t2 = new Date('2026-11-05T12:00:00Z');
      const t3 = new Date('2026-11-05T10:00:00Z');
      const t4 = new Date('2026-11-05T14:00:00Z');
      const t5 = new Date('2026-11-05T14:30:00Z');
      const t6 = new Date('2026-11-05T16:00:00Z');

      expect(intervalsOverlap(t1, t2, t3, t4)).toBe(true);
      expect(intervalsOverlap(t1, t2, t5, t6)).toBe(false);
    });
  });

  describe('findAll', () => {
    it('should return list of vehicles', async () => {
      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0].registrationNumber).toBe('AA-3-A12345');
    });

    it('should apply category and search filters when provided', async () => {
      await service.findAll({ category: VehicleCategory.SUV, search: 'Toyota' });
      expect(prisma.vehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: VehicleCategory.SUV,
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a vehicle with relationships if found', async () => {
      jest.spyOn(prisma.vehicle, 'findUnique').mockResolvedValue(mockVehicle as any);

      const result = await service.findOne('veh-1');
      expect(result.id).toBe('veh-1');
      expect(result.make).toBe('Toyota');
    });

    it('should throw NotFoundException if vehicle does not exist', async () => {
      jest.spyOn(prisma.vehicle, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a vehicle when registration number is unique', async () => {
      jest.spyOn(prisma.vehicle, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.vehicle, 'create').mockResolvedValue(mockVehicle as any);

      const result = await service.create({
        name: 'Toyota Land Cruiser',
        make: 'Toyota',
        model: 'Land Cruiser',
        registrationNumber: 'AA-3-A12345',
        category: VehicleCategory.SUV,
        passengerCapacity: 7,
      });

      expect(result.registrationNumber).toBe('AA-3-A12345');
      expect(prisma.vehicle.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if registration number is already registered', async () => {
      jest.spyOn(prisma.vehicle, 'findUnique').mockResolvedValue(mockVehicle as any);

      await expect(
        service.create({
          name: 'Toyota Land Cruiser',
          make: 'Toyota',
          model: 'Land Cruiser',
          registrationNumber: 'AA-3-A12345',
          category: VehicleCategory.SUV,
          passengerCapacity: 7,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
