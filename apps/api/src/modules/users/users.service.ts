import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './users.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany({
      include: { department: true },
      orderBy: { createdAt: 'desc' },
    });
    return users.map(({ passwordHash, ...safeUser }) => safeUser);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { department: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email.toLowerCase() },
          dto.employeeId ? { employeeId: dto.employeeId } : {},
        ],
      },
    });

    if (existing) {
      throw new ConflictException('User with this email or employee ID already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        employeeId: dto.employeeId || null,
        passwordHash,
        role: dto.role,
        departmentId: dto.departmentId || null,
      },
      include: { department: true },
    });

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        role: dto.role,
        departmentId: dto.departmentId,
        isActive: dto.isActive,
      },
      include: { department: true },
    });

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
