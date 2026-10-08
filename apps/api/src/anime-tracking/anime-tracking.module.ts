import {
  Module,
} from '@nestjs/common';

import {
  RequireAuthGuard,
} from '../auth/authorization/require-auth.guard.js';

import {
  ActivitiesModule,
} from '../activities/activities.module.js';

import {
  AchievementsModule,
} from '../achievements/achievements.module.js';

import {
  DatabaseModule,
} from '../database/database.module.js';

import {
  AnimeTrackingResolver,
} from './anime-tracking.resolver.js';

import {
  AnimeTrackingService,
} from './anime-tracking.service.js';

@Module({
  imports: [
    DatabaseModule,
    AchievementsModule,
    ActivitiesModule,
  ],

  providers: [
    AnimeTrackingResolver,
    AnimeTrackingService,
    RequireAuthGuard,
  ],

  exports: [
    AnimeTrackingService,
  ],
})
export class AnimeTrackingModule {}
