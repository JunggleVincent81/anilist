import { Module } from '@nestjs/common';
import { RequireAuthGuard } from '../auth/authorization/require-auth.guard.js';
import { DatabaseModule } from '../database/database.module.js';
import { NotificationsResolver } from './notifications.resolver.js';
import { NotificationsService } from './notifications.service.js';

@Module({
  imports: [DatabaseModule],
  providers: [NotificationsResolver, NotificationsService, RequireAuthGuard],
  exports: [NotificationsService],
})
export class NotificationsModule {}
