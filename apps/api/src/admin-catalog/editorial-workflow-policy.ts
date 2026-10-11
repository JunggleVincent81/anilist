import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';

/** AN-161A: pure private workflow policy; not a GraphQL endpoint or persistence service. */
export const EDITORIAL_WORKFLOW_POLICY_VERSION = 'AN-161A-v1';

export type EditorialWorkflowInput = {
  action: string;
  state: string;
  revision: number;
  actorId: string;
  actorRole: string;
  openedById: string | null;
  legacyChangeRequestId: string | null;
  note?: string;
};

export type EditorialWorkflowPlan = {
  expectedRevision: number;
  nextRevision: number;
  nextState: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'REJECTED';
  policyVersion: typeof EDITORIAL_WORKFLOW_POLICY_VERSION;
};

/**
 * Future callers MUST take actorId/actorRole from the authenticated server context,
 * and state/revision/owner/legacy ID from the persisted row, not client input.
 * This does not grant permission to approve, publish, unquarantine or mutate canonical data.
 */
export function planEditorialWorkflowTransition(input: EditorialWorkflowInput): EditorialWorkflowPlan {
  if (input.actorRole !== 'ADMIN') {
    throw new ForbiddenException('Editorial operations require ADMIN.');
  }
  if (!input.actorId || !input.openedById || !input.actorId.trim() || !input.openedById.trim()) {
    throw new ForbiddenException('A persisted opener and authenticated actor are required.');
  }
  if (input.legacyChangeRequestId !== null) {
    throw new ConflictException('Legacy synopsis requests must use the existing workflow.');
  }
  if (!Number.isSafeInteger(input.revision) || input.revision < 1 || input.revision > 2147483646) {
    throw new BadRequestException('Invalid expected revision.');
  }

  let nextState: EditorialWorkflowPlan['nextState'];
  if (input.action === 'SUBMIT') {
    if (input.state !== 'DRAFT') throw new ConflictException('Only DRAFT can be submitted.');
    if (input.actorId !== input.openedById) throw new ForbiddenException('Only the case opener can submit.');
    nextState = 'SUBMITTED';
  } else if (input.action === 'BEGIN_REVIEW') {
    if (input.state !== 'SUBMITTED') throw new ConflictException('Only SUBMITTED can enter review.');
    if (input.actorId === input.openedById) throw new ForbiddenException('Creator cannot review their own case.');
    nextState = 'UNDER_REVIEW';
  } else if (input.action === 'REQUEST_CHANGES' || input.action === 'REJECT') {
    if (input.state !== 'SUBMITTED' && input.state !== 'UNDER_REVIEW') {
      throw new ConflictException('Case must be submitted for human review.');
    }
    if (input.actorId === input.openedById) throw new ForbiddenException('Creator cannot review their own case.');
    if (typeof input.note !== 'string' || input.note.trim().length < 5 || input.note.trim().length > 2000) {
      throw new BadRequestException('Review note must contain 5–2000 characters.');
    }
    nextState = input.action === 'REJECT' ? 'REJECTED' : 'DRAFT';
  } else {
    throw new BadRequestException('Unapproved workflow action. Approval and publication remain separate gates.');
  }

  return {
    expectedRevision: input.revision,
    nextRevision: input.revision + 1,
    nextState,
    policyVersion: EDITORIAL_WORKFLOW_POLICY_VERSION,
  };
}
