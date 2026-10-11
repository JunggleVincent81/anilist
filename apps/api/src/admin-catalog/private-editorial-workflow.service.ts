import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { planEditorialWorkflowTransition } from './editorial-workflow-policy.js';

/**
 * AN-161B: INTERNAL-ONLY service. Intentionally NOT registered in any Nest module,
 * resolver, controller or public route. Do not enable until AN-162 adds a durable
 * per-transition audit trail and the new editorial DB migration is approved.
 *
 * actor MUST come from trusted server-side auth context in a future caller,
 * never from client-provided GraphQL/HTTP input.
 */
export type TrustedEditorialActor = { id: string; role: string };
export type PrivateEditorialTransitionInput = {
  caseId: string;
  expectedRevision: number;
  action: string;
  note?: string;
};

const UUID = /^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i;
const MAX_EXPECTED_REVISION = 2147483646;

@Injectable()
export class PrivateEditorialWorkflowService {
  constructor(private readonly prisma: PrismaService) {}

  async transition(actor: TrustedEditorialActor, input: PrivateEditorialTransitionInput) {
    // Fail closed before any DB query for non-admin or malformed requests.
    if (!actor || actor.role !== 'ADMIN' || !UUID.test(actor.id)) {
      throw new ForbiddenException('An authenticated ADMIN is required.');
    }
    if (!input || typeof input.caseId !== 'string' || !UUID.test(input.caseId)) {
      throw new BadRequestException('Invalid editorial case ID.');
    }
    if (!Number.isSafeInteger(input.expectedRevision) ||
        input.expectedRevision < 1 || input.expectedRevision > MAX_EXPECTED_REVISION) {
      throw new BadRequestException('Invalid expected revision.');
    }

    return this.prisma.$transaction(async tx => {
      const current = await tx.editorialCase.findUnique({
        where: { id: input.caseId },
        select: {
          id: true,
          state: true,
          revision: true,
          openedById: true,
          legacyChangeRequestId: true,
          candidateId: true,
          subjectType: true,
        },
      });
      if (!current) throw new NotFoundException('Editorial case not found.');
      if (current.revision !== input.expectedRevision) {
        throw new ConflictException('Editorial case has changed. Refresh before editing.');
      }

      // Decisions rely ONLY on state/ownership/legacy link read from the database.
      const plan = planEditorialWorkflowTransition({
        action: input.action,
        state: current.state,
        revision: current.revision,
        actorId: actor.id,
        actorRole: actor.role,
        openedById: current.openedById,
        legacyChangeRequestId: current.legacyChangeRequestId,
        note: input.note,
      });

      // Compare-and-swap inside the transaction: competing writers cannot both
      // advance the same revision. No writes to candidates, legacy or canonical rows.
      const changed = await tx.editorialCase.updateMany({
        where: {
          id: current.id,
          revision: plan.expectedRevision,
          state: current.state,
          openedById: current.openedById,
          legacyChangeRequestId: null,
          candidateId: current.candidateId,
          subjectType: current.subjectType,
        },
        data: { state: plan.nextState, revision: { increment: 1 } },
      });
      if (changed.count !== 1) {
        throw new ConflictException('Editorial case changed during transition.');
      }
      return {
        id: current.id,
        state: plan.nextState,
        revision: plan.nextRevision,
        policyVersion: plan.policyVersion,
      };
    });
  }
}
