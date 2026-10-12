import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { entityType?: string; entityId?: string; take?: number }) {
    const where: any = {};
    if (query?.entityType) where.entityType = query.entityType;
    if (query?.entityId) where.entityId = query.entityId;

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query?.take ? Number(query.take) : 100,
    });
  }
}
