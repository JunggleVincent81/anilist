import {
  Module,
} from '@nestjs/common';

import {
  DatabaseModule,
} from '../database/database.module.js';

import {
  UserStatisticsResolver,
} from './user-statistics.resolver.js';

import {
  UserStatisticsService,
} from './user-statistics.service.js';

@Module({
  imports: [
    DatabaseModule,
  ],

  providers: [
    UserStatisticsResolver,
    UserStatisticsService,
  ],

  exports: [
    UserStatisticsService,
  ],
})
export class UserStatisticsModule {}
