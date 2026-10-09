import {
  Module,
} from '@nestjs/common';

import {
  RequireAuthGuard,
} from '../auth/authorization/require-auth.guard.js';

import {
  DatabaseModule,
} from '../database/database.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

import {
  UserFollowsResolver,
} from './user-follows.resolver.js';

import {
  UserFollowsService,
} from './user-follows.service.js';

@Module({
  imports: [
    DatabaseModule,
    NotificationsModule,
  ],

  providers: [
    UserFollowsResolver,
    UserFollowsService,
    RequireAuthGuard,
  ],

  exports: [
    UserFollowsService,
  ],
})
class UserFollowsModule {}

export {
  UserFollowsModule,
};
