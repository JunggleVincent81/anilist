import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { RequireAuthGuard } from '../auth/authorization/require-auth.guard.js';
import { RolesGuard } from '../auth/authorization/roles.guard.js';
import { Roles } from '../auth/authorization/roles.decorator.js';
import type { GraphQLAuthContext } from '../auth/auth.types.js';
import { ModerationService, ReportConflictError, ReportTargetUnavailableError, ReportValidationError } from './moderation.service.js';
import { ContentReportReceiptType, ModerationReportType, ModerationQueueInput, ModerationReportsPageType, MyContentReportsPageType, ReportPageInput, ResolveContentReportInput, SubmitContentReportInput } from './moderation.graphql.js';

function rethrow(error: unknown): never {
  if (error instanceof ReportValidationError) throw new GraphQLError(error.message, { extensions: { code: 'BAD_USER_INPUT' } });
  if (error instanceof ReportConflictError) throw new GraphQLError(error.message, { extensions: { code: 'CONFLICT' } });
  if (error instanceof ReportTargetUnavailableError) throw new GraphQLError(error.message, { extensions: { code: 'NOT_FOUND' } });
  throw error;
}

@Resolver()
export class ModerationResolver {
  constructor(private readonly reports: ModerationService) {}

  @Mutation(() => ContentReportReceiptType)
  @UseGuards(RequireAuthGuard)
  async submitContentReport(
    @Args('input') input: SubmitContentReportInput,
    @Context() context: GraphQLAuthContext,
  ): Promise<ContentReportReceiptType> {
    try { return await this.reports.submit(context.currentUser!.id, input); }
    catch (error) { return rethrow(error); }
  }

  @Query(() => MyContentReportsPageType)
  @UseGuards(RequireAuthGuard)
  async myContentReports(
    @Context() context: GraphQLAuthContext,
    @Args('input', { type: () => ReportPageInput, nullable: true }) input?: ReportPageInput,
  ): Promise<MyContentReportsPageType> {
    try { return await this.reports.mine(context.currentUser!.id, input); }
    catch (error) { return rethrow(error); }
  }

  @Query(() => ModerationReportsPageType)
  @UseGuards(RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  async moderationReports(
    @Args('input', { type: () => ModerationQueueInput, nullable: true }) input?: ModerationQueueInput,
  ): Promise<ModerationReportsPageType> {
    try { return await this.reports.queue(input); }
    catch (error) { return rethrow(error); }
  }

  @Mutation(() => ModerationReportType)
  @UseGuards(RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  async resolveContentReport(
    @Args('input') input: ResolveContentReportInput,
    @Context() context: GraphQLAuthContext,
  ): Promise<ModerationReportType> {
    try { return await this.reports.resolve(context.currentUser!.id, input); }
    catch (error) { return rethrow(error); }
  }
}
