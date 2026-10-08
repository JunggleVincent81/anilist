import {
  Module,
} from '@nestjs/common';

import {
  AiringScheduleModule,
} from './airing-schedule/airing-schedule.module.js';

import {
  AchievementsModule,
} from './achievements/achievements.module.js';

import {
  AnimeFavoritesModule,
} from './anime-favorites/anime-favorites.module.js';

import {
  AnimeTrackingModule,
} from './anime-tracking/anime-tracking.module.js';

import {
  AnimeModule,
} from './anime/anime.module.js';

import {
  AuthModule,
} from './auth/auth.module.js';

import {
  DatabaseModule,
} from './database/database.module.js';

import {
  GraphqlModule,
} from './graphql/graphql.module.js';

import {
  HealthModule,
} from './health/health.module.js';

import {
  UserStatisticsModule,
} from './user-statistics/user-statistics.module.js';

import {
  UsersModule,
} from './users/users.module.js';

@Module({
  imports: [
    DatabaseModule,

    AuthModule,
    UsersModule,
    AnimeModule,
    AiringScheduleModule,
    AnimeTrackingModule,
    AnimeFavoritesModule,
    AchievementsModule,
    UserStatisticsModule,

    GraphqlModule,
    HealthModule,
  ],
})
export class AppModule {}