import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { ModerationResolver } from './moderation.resolver.js';
import { ModerationService } from './moderation.service.js';

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [ModerationResolver, ModerationService],
})
export class ModerationModule {}
