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
  AnimeTrackingResolver,
} from './anime-tracking.resolver.js';

import {
  AnimeTrackingService,
} from './anime-tracking.service.js';

@Module({
  imports: [
    DatabaseModule,
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
