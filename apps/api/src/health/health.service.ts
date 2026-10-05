import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Health } from './health.type.js';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<Health> {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok' };
  }
}
