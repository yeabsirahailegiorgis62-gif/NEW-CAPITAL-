import { Injectable, ConflictException } from '@nestjs/common';
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

  async create(name: string, description?: string) {
    const existing = await this.prisma.department.findUnique({ where: { name } });
    if (existing) throw new ConflictException('Department already exists');

    return this.prisma.department.create({
      data: { name, description },
    });
  }
}
