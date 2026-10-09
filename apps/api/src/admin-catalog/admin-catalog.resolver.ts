import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/authorization/roles.decorator.js';
import { RolesGuard } from '../auth/authorization/roles.guard.js';
import { AdminCatalogOverviewType, AdminCatalogPageInput, AdminCatalogPageType } from './admin-catalog.graphql.js';
import { AdminCatalogService } from './admin-catalog.service.js';

@Resolver()
export class AdminCatalogResolver {
  constructor(private readonly adminCatalog: AdminCatalogService) {}

  @Query(() => AdminCatalogOverviewType)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  adminCatalogOverview(): Promise<AdminCatalogOverviewType> {
    return this.adminCatalog.overview();
  }

  @Query(() => AdminCatalogPageType)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  adminCatalogPage(
    @Args('input', { type: () => AdminCatalogPageInput, nullable: true }) input?: AdminCatalogPageInput,
  ): Promise<AdminCatalogPageType> {
    return this.adminCatalog.page(input);
  }
}
