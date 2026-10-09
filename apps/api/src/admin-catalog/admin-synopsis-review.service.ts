import { BadRequestException, ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { CatalogChangeKind, CatalogChangeState, CatalogReviewAction, CatalogReviewTrack } from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';
import type { ReviewAdminSynopsisInput, SubmitAdminSynopsisInput } from './admin-synopsis-review.graphql.js';

const POLICY_VERSION = 'AN-144-v1';
function validateRevision(value: number) {
  if (!Number.isSafeInteger(value) || value < 1 || value > 2147483646) throw new BadRequestException('Invalid revision.');
}
@Injectable()
export class AdminSynopsisReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(actorId: string, input: SubmitAdminSynopsisInput) {
    validateRevision(input.expectedRevision);
    const result = await this.prisma.catalogChangeRequest.updateMany({
      where: { id: input.draftId, creatorId: actorId, kind: CatalogChangeKind.SYNOPSIS,
        state: CatalogChangeState.DRAFT, revision: input.expectedRevision },
      data: { state: CatalogChangeState.SUBMITTED, submittedAt: new Date(), revision: { increment: 1 } },
    });
    if (result.count !== 1) throw new ConflictException('Draft not owned, already submitted, or revision changed.');
    return { id: input.draftId, state: CatalogChangeState.SUBMITTED, revision: input.expectedRevision + 1 };
  }

  async review(actorId: string, input: ReviewAdminSynopsisInput) {
    validateRevision(input.expectedRevision);
    if (input.action !== 'REQUEST_CHANGES' && input.action !== 'REJECT') throw new BadRequestException('Approval requires a separate policy gate.');
    if (typeof input.note !== 'string' || input.note.trim().length < 5 || input.note.trim().length > 2000) throw new BadRequestException('Review note must contain 5–2000 characters.');
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.catalogChangeRequest.findFirst({ where: { id: input.draftId, kind: CatalogChangeKind.SYNOPSIS,
        state: { in: [CatalogChangeState.SUBMITTED, CatalogChangeState.UNDER_REVIEW] }, revision: input.expectedRevision },
        select: { creatorId: true } });
      if (!existing) throw new ConflictException('Submission is missing or changed.');
      if (existing.creatorId === actorId) throw new ForbiddenException('Creator cannot review own submission.');
      const nextState = input.action === 'REJECT' ? CatalogChangeState.REJECTED : CatalogChangeState.DRAFT;
      const changed = await tx.catalogChangeRequest.updateMany({ where: { id: input.draftId, kind: CatalogChangeKind.SYNOPSIS,
        state: { in: [CatalogChangeState.SUBMITTED, CatalogChangeState.UNDER_REVIEW] }, revision: input.expectedRevision },
        data: { state: nextState, revision: { increment: 1 } } });
      if (changed.count !== 1) throw new ConflictException('Submission changed during review.');
      await tx.catalogReviewDecision.create({ data: { changeRequestId: input.draftId, actorId,
        reviewTrack: CatalogReviewTrack.SYNOPSIS,
        action: input.action === 'REJECT' ? CatalogReviewAction.REJECT : CatalogReviewAction.REQUEST_CHANGES,
        draftRevision: input.expectedRevision, decisionNote: input.note.trim(), policyVersion: POLICY_VERSION } });
      return { id: input.draftId, state: nextState, revision: input.expectedRevision + 1 };
    });
  }
}
