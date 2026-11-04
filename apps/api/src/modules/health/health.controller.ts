// CONTROLLER: Liveness/readiness check used by start.sh and operators (GET /api/health).
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'System and database health check' })
  @ApiResponse({ status: 200, description: 'Service is operational' })
  async check() {
    let dbStatus = 'connected';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (e: any) {
      dbStatus = `disconnected: ${e.message}`;
    }

    return {
      status: dbStatus === 'connected' ? 'ok' : 'degraded',
      service: 'Capital Fleet Logistics Engine',
      version: '1.0.0',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: dbStatus,
      timezone: 'Africa/Addis_Ababa (UTC+3)',
    };
  }
}
