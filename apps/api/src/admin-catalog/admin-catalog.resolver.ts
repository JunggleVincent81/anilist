import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/authorization/roles.decorator.js';
import { RolesGuard } from '../auth/authorization/roles.guard.js';
import { AdminCatalogOverviewType, AdminCatalogPageInput, AdminCatalogPageType } from './admin-catalog.graphql.js';
import { AdminCatalogService } from './admin-catalog.service.js';
import type { GraphQLAuthContext } from '../auth/auth.types.js';
import { AdminSynopsisDraftService } from './admin-synopsis-draft.service.js';
import { AdminSynopsisDraftType, CreateAdminSynopsisDraftInput, UpdateAdminSynopsisDraftInput } from './admin-synopsis-draft.graphql.js';

@Resolver()
export class AdminCatalogResolver {
  constructor(private readonly adminCatalog: AdminCatalogService, private readonly synopsisDrafts: AdminSynopsisDraftService) {}

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
  @Mutation(() => AdminSynopsisDraftType)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  createAdminSynopsisDraft(@Args('input') input: CreateAdminSynopsisDraftInput, @Context() context: GraphQLAuthContext): Promise<AdminSynopsisDraftType> {
    return this.synopsisDrafts.create(context.currentUser!.id, input);
  }

  @Query(() => AdminSynopsisDraftType)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  adminSynopsisDraft(@Args('draftId', { type: () => String }) draftId: string, @Context() context: GraphQLAuthContext): Promise<AdminSynopsisDraftType> {
    return this.synopsisDrafts.mine(context.currentUser!.id, draftId);
  }

  @Mutation(() => AdminSynopsisDraftType)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  updateAdminSynopsisDraft(@Args('input') input: UpdateAdminSynopsisDraftInput, @Context() context: GraphQLAuthContext): Promise<AdminSynopsisDraftType> {
    return this.synopsisDrafts.update(context.currentUser!.id, input);
  }
}
