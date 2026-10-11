import { Module } from '@nestjs/common';
import { AdminSynopsisQueueService } from './admin-synopsis-queue.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { AdminCatalogResolver } from './admin-catalog.resolver.js';
import { AdminSynopsisReviewService } from './admin-synopsis-review.service.js';
import { AdminSynopsisDraftService } from './admin-synopsis-draft.service.js';
import { AdminCatalogService } from './admin-catalog.service.js';
import { AdminWorkspaceOverviewService } from './admin-workspace-overview.service.js';
import { AdminAnimeCandidatesService } from './admin-anime-candidates.service.js';
import { AdminDomainRecordsService } from './admin-domain-records.service.js';
import { AdminStructuredCandidatesService } from './admin-structured-candidates.service.js';
import { AdminRelationManagerService } from './admin-relation-manager.service.js';

@Module({
  imports: [AuthModule],
  providers: [AdminCatalogResolver, AdminCatalogService, AdminWorkspaceOverviewService, AdminAnimeCandidatesService, AdminDomainRecordsService, AdminStructuredCandidatesService, AdminRelationManagerService, AdminSynopsisDraftService, AdminSynopsisReviewService, AdminSynopsisQueueService],
})
export class AdminCatalogModule {}
