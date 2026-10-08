import {
  Module,
} from '@nestjs/common';

import {
  RequireAuthGuard,
} from '../auth/authorization/require-auth.guard.js';

import {
  DatabaseModule,
} from '../database/database.module.js';

import {
  AchievementCatalogService,
} from './achievement-catalog.service.js';

import {
  AchievementEvaluatorService,
} from './achievement-evaluator.service.js';

import {
  AchievementReconciliationService,
} from './achievement-reconciliation.service.js';

import {
  AchievementsResolver,
} from './achievements.resolver.js';

import {
  AchievementsService,
} from './achievements.service.js';

@Module({
  imports: [
    DatabaseModule,
  ],

  providers: [
    AchievementCatalogService,
    AchievementEvaluatorService,
    AchievementReconciliationService,
    AchievementsService,
    AchievementsResolver,
    RequireAuthGuard,
  ],

  exports: [
    AchievementCatalogService,
    AchievementEvaluatorService,
    AchievementReconciliationService,
    AchievementsService,
  ],
})
export class AchievementsModule {}
