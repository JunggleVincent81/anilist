import { Module } from '@nestjs/common';
import { HealthResolver } from './health.resolver.js';
import { HealthService } from './health.service.js';
import { HealthHttpController } from './health.http.controller.js';

@Module({
  controllers: [HealthHttpController],
  providers: [HealthResolver, HealthService]
})
export class HealthModule {}
