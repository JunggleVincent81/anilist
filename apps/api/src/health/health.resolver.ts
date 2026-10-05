import { Query, Resolver } from '@nestjs/graphql';
import { HealthService } from './health.service.js';
import { Health } from './health.type.js';

@Resolver(() => Health)
export class HealthResolver {
  constructor(private readonly healthService: HealthService) {}

  @Query(() => Health)
  health(): Promise<Health> {
    return this.healthService.check();
  }
}
