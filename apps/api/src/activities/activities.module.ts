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
  ActivitiesResolver,
} from './activities.resolver.js';

import {
  ActivitiesService,
} from './activities.service.js';

import {
  ActivityEventService,
} from './activity-event.service.js';

import {
  ActivityInteractionsResolver,
} from './activity-interactions.resolver.js';

import {
  ActivityInteractionsService,
} from './activity-interactions.service.js';

import {
  ActivitySettingsResolver,
} from './activity-settings.resolver.js';

import {
  ActivitySettingsService,
} from './activity-settings.service.js';

@Module({
  imports: [
    DatabaseModule,
  ],

  providers: [
    ActivitiesResolver,
    ActivitiesService,

    ActivityInteractionsResolver,
    ActivityInteractionsService,
    ActivityEventService,

    ActivitySettingsResolver,
    ActivitySettingsService,

    RequireAuthGuard,
  ],

  exports: [
    ActivitiesService,
    ActivityEventService,
    ActivitySettingsService,
  ],
})
class ActivitiesModule {}

export {
  ActivitiesModule,
};
