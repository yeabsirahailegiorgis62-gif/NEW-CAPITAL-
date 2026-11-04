// SERVICE: Department CRUD. Delete is blocked while users still belong to the department.
import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.department.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: { name: string; code?: string; description?: string }) {
    const existingName = await this.prisma.department.findUnique({ where: { name: data.name } });
    if (existingName) throw new ConflictException(`Department "${data.name}" already exists.`);

    if (data.code) {
      const existingCode = await this.prisma.department.findUnique({ where: { code: data.code } });
      if (existingCode) throw new ConflictException(`Department code "${data.code}" is already in use.`);
    }

    return this.prisma.department.create({
      data: {
        name: data.name.trim(),
        code: data.code?.trim().toUpperCase(),
        description: data.description?.trim(),
        isActive: true,
      },
    });
  }

  async update(id: string, data: { name?: string; code?: string; description?: string; isActive?: boolean }) {
    const existing = await this.prisma.department.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Department not found.');

    if (data.name && data.name !== existing.name) {
      const duplicate = await this.prisma.department.findUnique({ where: { name: data.name } });
      if (duplicate) throw new ConflictException(`Department "${data.name}" already exists.`);
    }

    if (data.code && data.code !== existing.code) {
      const duplicateCode = await this.prisma.department.findUnique({ where: { code: data.code } });
      if (duplicateCode) throw new ConflictException(`Department code "${data.code}" is already in use.`);
    }

    return this.prisma.department.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        code: data.code?.trim().toUpperCase(),
        description: data.description?.trim(),
        isActive: data.isActive !== undefined ? data.isActive : existing.isActive,
      },
    });
  }

  async remove(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!department) throw new NotFoundException('Department not found.');

    if (department._count.users > 0) {
      throw new BadRequestException(
        `Cannot delete department "${department.name}" because it currently has ${department._count.users} active staff assigned. Reassign staff members before deleting.`
      );
    }

    return this.prisma.department.delete({
      where: { id },
    });
  }
}
