import { UseGuards } from '@nestjs/common';
import { ID, Int } from '@nestjs/graphql';
import { AdminSynopsisQueueService } from './admin-synopsis-queue.service.js';
import { AdminSynopsisQueuePage } from './admin-synopsis-queue.graphql.js';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/authorization/roles.decorator.js';
import { RolesGuard } from '../auth/authorization/roles.guard.js';
import { AdminCatalogOverviewType, AdminCatalogPageInput, AdminCatalogPageType } from './admin-catalog.graphql.js';
import { AdminCatalogService } from './admin-catalog.service.js';
import { AdminWorkspaceOverviewService } from './admin-workspace-overview.service.js';
import { AdminWorkspaceOverviewType } from './admin-workspace-overview.graphql.js';
import { AdminAnimeCandidatesService } from './admin-anime-candidates.service.js';
import { AdminDomainRecordsService } from './admin-domain-records.service.js';
import { AdminDomainPageInput, AdminDomainRecordPageType } from './admin-domain-records.graphql.js';
import { AdminStructuredCandidatesService } from './admin-structured-candidates.service.js';
import { AdminRelationManagerService } from './admin-relation-manager.service.js';
import { AdminMediaEvidenceService } from './admin-media-evidence.service.js';
import { AdminEditorialReviewService } from './admin-editorial-review.service.js';
import { AdminEditorialPageInput, AdminEditorialCasePageType, AdminEditorialCaseItemType, AdminEditorialCaseDetailType, CreateAdminEditorialCaseInput, TransitionAdminEditorialCaseInput } from './admin-editorial-review.graphql.js';
import { AdminMediaEvidencePageInput, AdminSourceDossierPageType, AdminMediaIntakePageType, AdminSourceDossierType, AdminMediaIntakeType, CreateAdminSourceDossierInput, CreateAdminMediaIntakeInput } from './admin-media-evidence.graphql.js';
import { AdminRelationPageInput, AdminRelationProposalPageType, AdminRelationProposalType, AdminRelationCanonicalPageType, CreateAdminRelationProposalInput } from './admin-relation-manager.graphql.js';
import { AdminStructuredCandidatePageInput, AdminStructuredCandidatePageType, AdminStructuredCandidateType, CreateAdminStructuredCandidateInput, UpdateAdminStructuredCandidateInput } from './admin-structured-candidates.graphql.js';
import { AdminAnimeCandidatePageInput, AdminAnimeCandidatePageType, AdminAnimeCandidateType, CreateAdminAnimeCandidateInput, UpdateAdminAnimeCandidateInput } from './admin-anime-candidates.graphql.js';
import type { GraphQLAuthContext } from '../auth/auth.types.js';
import { AdminSynopsisReviewService } from './admin-synopsis-review.service.js';
import { AdminSynopsisWorkflowType, SubmitAdminSynopsisInput, ReviewAdminSynopsisInput } from './admin-synopsis-review.graphql.js';
import { AdminSynopsisDraftService } from './admin-synopsis-draft.service.js';
import { AdminSynopsisDraftType, CreateAdminSynopsisDraftInput, UpdateAdminSynopsisDraftInput } from './admin-synopsis-draft.graphql.js';

@Resolver()
export class AdminCatalogResolver {
  constructor(private readonly adminCatalog: AdminCatalogService, private readonly synopsisDrafts: AdminSynopsisDraftService, private readonly synopsisReviews: AdminSynopsisReviewService, private readonly synopsisQueue: AdminSynopsisQueueService, private readonly workspaceOverview: AdminWorkspaceOverviewService, private readonly animeCandidates: AdminAnimeCandidatesService, private readonly domainRecords: AdminDomainRecordsService, private readonly structuredCandidates: AdminStructuredCandidatesService, private readonly relations: AdminRelationManagerService, private readonly mediaEvidence: AdminMediaEvidenceService, private readonly editorialReview: AdminEditorialReviewService) {}

  @Query(() => AdminWorkspaceOverviewType)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  adminWorkspaceOverview(): Promise<AdminWorkspaceOverviewType> {
    return this.workspaceOverview.overview();
  }

  @Query(() => AdminAnimeCandidatePageType)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  adminAnimeCandidatePage(@Args('input', { type: () => AdminAnimeCandidatePageInput, nullable: true }) input: AdminAnimeCandidatePageInput | undefined,
    @Context() context: GraphQLAuthContext): Promise<AdminAnimeCandidatePageType> {
    return this.animeCandidates.page(context.currentUser!.id, input);
  }

  @Mutation(() => AdminAnimeCandidateType)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  createAdminAnimeCandidate(@Args('input') input: CreateAdminAnimeCandidateInput,
    @Context() context: GraphQLAuthContext): Promise<AdminAnimeCandidateType> {
    return this.animeCandidates.create(context.currentUser!.id, input);
  }

  @Mutation(() => AdminAnimeCandidateType)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  updateAdminAnimeCandidate(@Args('input') input: UpdateAdminAnimeCandidateInput,
    @Context() context: GraphQLAuthContext): Promise<AdminAnimeCandidateType> {
    return this.animeCandidates.update(context.currentUser!.id, input);
  }

  @Query(() => AdminDomainRecordPageType)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  adminDomainRecordPage(@Args('input') input: AdminDomainPageInput): Promise<AdminDomainRecordPageType> {
    return this.domainRecords.page(input);
  }

  @Query(() => AdminStructuredCandidatePageType)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  adminStructuredCandidatePage(@Args('input') input: AdminStructuredCandidatePageInput,
    @Context() context: GraphQLAuthContext): Promise<AdminStructuredCandidatePageType> {
    return this.structuredCandidates.page(context.currentUser!.id, input);
  }

  @Mutation(() => AdminStructuredCandidateType)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  createAdminStructuredCandidate(@Args('input') input: CreateAdminStructuredCandidateInput,
    @Context() context: GraphQLAuthContext): Promise<AdminStructuredCandidateType> {
    return this.structuredCandidates.create(context.currentUser!.id, input);
  }

  @Mutation(() => AdminStructuredCandidateType)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  updateAdminStructuredCandidate(@Args('input') input: UpdateAdminStructuredCandidateInput,
    @Context() context: GraphQLAuthContext): Promise<AdminStructuredCandidateType> {
    return this.structuredCandidates.update(context.currentUser!.id, input);
  }

  @Query(() => AdminRelationCanonicalPageType)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  adminRelationCanonicalPage(@Args('input') input: AdminRelationPageInput,
    @Context() context: GraphQLAuthContext): Promise<AdminRelationCanonicalPageType> {
    return this.relations.canonical(context.currentUser!.id, input);
  }

  @Query(() => AdminRelationProposalPageType)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  adminRelationProposalPage(@Args('input') input: AdminRelationPageInput,
    @Context() context: GraphQLAuthContext): Promise<AdminRelationProposalPageType> {
    return this.relations.proposals(context.currentUser!.id, input);
  }

  @Mutation(() => AdminRelationProposalType)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  createAdminRelationProposal(@Args('input') input: CreateAdminRelationProposalInput,
    @Context() context: GraphQLAuthContext): Promise<AdminRelationProposalType> {
    return this.relations.create(context.currentUser!.id, input);
  }

  @Query(() => AdminSourceDossierPageType)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  adminSourceDossiers(@Args('input', { type: () => AdminMediaEvidencePageInput, nullable: true }) input: AdminMediaEvidencePageInput | undefined,
    @Context() context: GraphQLAuthContext): Promise<AdminSourceDossierPageType> {
    return this.mediaEvidence.sources(context.currentUser!.id, input);
  }

  @Query(() => AdminMediaIntakePageType)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  adminMediaIntakes(@Args('input', { type: () => AdminMediaEvidencePageInput, nullable: true }) input: AdminMediaEvidencePageInput | undefined,
    @Context() context: GraphQLAuthContext): Promise<AdminMediaIntakePageType> {
    return this.mediaEvidence.media(context.currentUser!.id, input);
  }

  @Mutation(() => AdminSourceDossierType)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  createAdminSourceDossier(@Args('input') input: CreateAdminSourceDossierInput,
    @Context() context: GraphQLAuthContext): Promise<AdminSourceDossierType> {
    return this.mediaEvidence.addSource(context.currentUser!.id, input);
  }

  @Mutation(() => AdminSourceDossierType)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  revokeAdminSourceDossier(@Args('id', { type: () => ID }) id: string,
    @Context() context: GraphQLAuthContext): Promise<AdminSourceDossierType> {
    return this.mediaEvidence.revokeSource(context.currentUser!.id, id);
  }

  @Mutation(() => AdminMediaIntakeType)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  createAdminMediaIntake(@Args('input') input: CreateAdminMediaIntakeInput,
    @Context() context: GraphQLAuthContext): Promise<AdminMediaIntakeType> {
    return this.mediaEvidence.addMedia(context.currentUser!.id, input);
  }

  @Query(() => AdminEditorialCasePageType)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  adminEditorialCases(@Args('input', { type: () => AdminEditorialPageInput, nullable: true }) input: AdminEditorialPageInput | undefined,
    @Context() context: GraphQLAuthContext): Promise<AdminEditorialCasePageType> {
    return this.editorialReview.page(context.currentUser!.id, input);
  }

  @Query(() => AdminEditorialCaseDetailType)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  adminEditorialCaseDetail(@Args('id', {type: () => ID}) id: string,
    @Context() context: GraphQLAuthContext): Promise<AdminEditorialCaseDetailType> {
    return this.editorialReview.detail(context.currentUser!.id, id);
  }

  @Mutation(() => AdminEditorialCaseItemType)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  createAdminEditorialCase(@Args('input') input: CreateAdminEditorialCaseInput,
    @Context() context: GraphQLAuthContext): Promise<AdminEditorialCaseItemType> {
    return this.editorialReview.create(context.currentUser!.id, input);
  }

  @Mutation(() => AdminEditorialCaseItemType)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  transitionAdminEditorialCase(@Args('input') input: TransitionAdminEditorialCaseInput,
    @Context() context: GraphQLAuthContext): Promise<AdminEditorialCaseItemType> {
    return this.editorialReview.transition(context.currentUser!.id, input);
  }

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
  @Mutation(() => AdminSynopsisWorkflowType)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  submitAdminSynopsisDraft(@Args('input') input: SubmitAdminSynopsisInput, @Context() context: GraphQLAuthContext): Promise<AdminSynopsisWorkflowType> {
    return this.synopsisReviews.submit(context.currentUser!.id, input);
  }

  @Mutation(() => AdminSynopsisWorkflowType)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  reviewAdminSynopsisSubmission(@Args('input') input: ReviewAdminSynopsisInput, @Context() context: GraphQLAuthContext): Promise<AdminSynopsisWorkflowType> {
    return this.synopsisReviews.review(context.currentUser!.id, input);
  }
  @Query(() => AdminSynopsisQueuePage)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  adminSynopsisReviewQueue(@Args('page', { type: () => Int, nullable: true }) page?: number): Promise<AdminSynopsisQueuePage> {
    return this.synopsisQueue.page(page ?? 1);
  }

}
