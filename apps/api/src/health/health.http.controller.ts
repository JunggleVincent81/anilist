import {
  Controller,
  Get,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HealthService } from './health.service.js';

/** Liveness is intentionally independent of external dependencies. */
@Controller('health')
export class HealthHttpController {
  constructor(private readonly healthService: HealthService) {}

  @Get('live')
  live(): { status: string } {
    return { status: 'ok' };
  }

  /** Readiness requires database availability; do not expose error details. */
  @Get('ready')
  async ready(): Promise<{ status: string }> {
    try {
      return await this.healthService.check();
    } catch {
      throw new ServiceUnavailableException('Service unavailable');
    }
  }
}
