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
    ActivitySettingsResolver,
    ActivitySettingsService,
    RequireAuthGuard,
  ],

  exports: [
    ActivitySettingsService,
  ],
})
class ActivitiesModule {}

export {
  ActivitiesModule,
};
