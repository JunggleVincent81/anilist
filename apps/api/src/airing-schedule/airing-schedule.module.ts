import {
  Module,
} from '@nestjs/common';

import {
  DatabaseModule,
} from '../database/database.module.js';

import {
  AniListAiringClient,
} from './anilist-airing.client.js';

import {
  AiringScheduleResolver,
} from './airing-schedule.resolver.js';

import {
  AiringScheduleService,
} from './airing-schedule.service.js';

@Module({
  imports: [
    DatabaseModule,
  ],

  providers: [
    AniListAiringClient,
    AiringScheduleResolver,
    AiringScheduleService,
  ],

  exports: [
    AiringScheduleService,
  ],
})
export class AiringScheduleModule {}
