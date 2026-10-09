import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AdminCatalogResolver } from './admin-catalog.resolver.js';
import { AdminSynopsisDraftService } from './admin-synopsis-draft.service.js';
import { AdminCatalogService } from './admin-catalog.service.js';

@Module({
  imports: [AuthModule],
  providers: [AdminCatalogResolver, AdminCatalogService, AdminSynopsisDraftService],
})
export class AdminCatalogModule {}
