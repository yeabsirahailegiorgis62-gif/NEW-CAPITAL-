import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentsService } from './departments.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';

describe('DepartmentsService', () => {
  let service: DepartmentsService;
  let prisma: PrismaService;

  const mockDepartment = {
    id: 'dept-1',
    name: 'Logistics',
    code: 'LOG',
    description: 'Fleet & Logistics Department',
    isActive: true,
    _count: { users: 0 },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentsService,
        {
          provide: PrismaService,
          useValue: {
            department: {
              findMany: jest.fn().mockResolvedValue([mockDepartment]),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<DepartmentsService>(DepartmentsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all departments with user counts', async () => {
      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Logistics');
      expect(prisma.department.findMany).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a department successfully', async () => {
      jest.spyOn(prisma.department, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.department, 'create').mockResolvedValue(mockDepartment as any);

      const result = await service.create({
        name: 'Logistics',
        code: 'LOG',
        description: 'Fleet & Logistics',
      });

      expect(result.name).toBe('Logistics');
      expect(prisma.department.create).toHaveBeenCalledWith({
        data: {
          name: 'Logistics',
          code: 'LOG',
          description: 'Fleet & Logistics',
          isActive: true,
        },
      });
    });

    it('should throw ConflictException if department name already exists', async () => {
      jest.spyOn(prisma.department, 'findUnique').mockResolvedValueOnce(mockDepartment as any);

      await expect(service.create({ name: 'Logistics' })).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if department code already exists', async () => {
      jest.spyOn(prisma.department, 'findUnique')
        .mockResolvedValueOnce(null) // name check passes
        .mockResolvedValueOnce(mockDepartment as any); // code check fails

      await expect(service.create({ name: 'Marketing', code: 'LOG' })).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update department fields successfully', async () => {
      jest.spyOn(prisma.department, 'findUnique')
        .mockResolvedValueOnce(mockDepartment as any) // existing check
        .mockResolvedValueOnce(null); // duplicate name check

      jest.spyOn(prisma.department, 'update').mockResolvedValue({
        ...mockDepartment,
        name: 'Global Logistics',
      } as any);

      const result = await service.update('dept-1', { name: 'Global Logistics' });
      expect(result.name).toBe('Global Logistics');
    });

    it('should throw NotFoundException if department to update does not exist', async () => {
      jest.spyOn(prisma.department, 'findUnique').mockResolvedValue(null);

      await expect(service.update('invalid-id', { name: 'New' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete department if no users are assigned', async () => {
      jest.spyOn(prisma.department, 'findUnique').mockResolvedValue(mockDepartment as any);
      jest.spyOn(prisma.department, 'delete').mockResolvedValue(mockDepartment as any);

      const result = await service.remove('dept-1');
      expect(result.id).toBe('dept-1');
      expect(prisma.department.delete).toHaveBeenCalledWith({ where: { id: 'dept-1' } });
    });

    it('should throw BadRequestException if department has assigned users', async () => {
      jest.spyOn(prisma.department, 'findUnique').mockResolvedValue({
        ...mockDepartment,
        _count: { users: 5 },
      } as any);

      await expect(service.remove('dept-1')).rejects.toThrow(BadRequestException);
    });
  });
});
