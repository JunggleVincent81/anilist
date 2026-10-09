import { Module } from '@nestjs/common';
import { AdminSynopsisQueueService } from './admin-synopsis-queue.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { AdminCatalogResolver } from './admin-catalog.resolver.js';
import { AdminSynopsisReviewService } from './admin-synopsis-review.service.js';
import { AdminSynopsisDraftService } from './admin-synopsis-draft.service.js';
import { AdminCatalogService } from './admin-catalog.service.js';

@Module({
  imports: [AuthModule],
  providers: [AdminCatalogResolver, AdminCatalogService, AdminSynopsisDraftService, AdminSynopsisReviewService, AdminSynopsisQueueService],
})
export class AdminCatalogModule {}
