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
  ActivitiesModule,
} from '../activities/activities.module.js';

import {
  ReviewsResolver,
} from './reviews.resolver.js';

import {
  ReviewsService,
} from './reviews.service.js';

@Module({
  imports: [DatabaseModule, ActivitiesModule],
  providers: [
    ReviewsResolver,
    ReviewsService,
    RequireAuthGuard,
  ],
  exports: [ReviewsService],
})
class ReviewsModule {}

export { ReviewsModule };
