import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { TrustedEditorialActor } from './private-editorial-workflow.service.js';
import {
  SYNOPSIS_POLICY_VERSION, SYNOPSIS_UUID, sha256Text, strictSynopsis, validateCaseCommand,
  validatePrivateActor, verifyPersistedSynopsisEvidence,
} from './private-synopsis-integrity.js';

export type PrivateSynopsisCommitInput = {
  caseId: string;
  expectedRevision: number;
  expectedAnimeUpdatedAt: string;
};

/**
 * AN-166: private audited Anime.description-only writer. NOT registered or exposed.
 * Approval is not publication; this never changes catalogStatus, isAdult or assets.
 */
@Injectable()
export class PrivateAnimeSynopsisCommitService {
  constructor(private readonly prisma: PrismaService) {}

  async commit(actor: TrustedEditorialActor, input: PrivateSynopsisCommitInput) {
    validatePrivateActor(actor);
    if (!input || typeof input.caseId !== 'string') throw new BadRequestException('Invalid commit input.');
    validateCaseCommand(input.caseId, input.expectedRevision);
    if (typeof input.expectedAnimeUpdatedAt !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(input.expectedAnimeUpdatedAt) ||
        !Number.isFinite(Date.parse(input.expectedAnimeUpdatedAt))) {
      throw new BadRequestException('An exact ISO-8601 canonical compare-and-swap token is required.');
    }
    const expectedUpdatedAt = new Date(input.expectedAnimeUpdatedAt);
    return this.prisma.$transaction(async tx => {
      const dbActor = await tx.user.findUnique({ where: { id: actor.id }, select: { role: true } });
      if (dbActor?.role !== 'ADMIN') throw new ForbiddenException('Actor is not an administrator.');
      const current = await tx.editorialCase.findUnique({
        where: { id: input.caseId }, include: { candidate: true },
      });
      if (!current) throw new NotFoundException('Editorial case not found.');
      if (current.subjectType !== 'ANIME' || current.state !== 'APPROVED' ||
          current.legacyChangeRequestId !== null || current.revision !== input.expectedRevision ||
          !current.candidate || !SYNOPSIS_UUID.test(current.canonicalEntityId ?? '') ||
          !SYNOPSIS_UUID.test(current.openedById ?? '')) {
        throw new ConflictException('Persisted approved ANIME case is required.');
      }
      const candidate = current.candidate;
      if (candidate.id !== current.candidateId || candidate.subjectType !== 'ANIME') {
        throw new ConflictException('Case/candidate identity mismatch.');
      }
      const approval = await tx.editorialSynopsisApproval.findUnique({
        where: { caseId: current.id },
        include: { evidence: { include: { verifier: { select: { role: true } } } } },
      });
      if (!approval || approval.animeId !== current.canonicalEntityId ||
          approval.reviewedRevision + 1 !== approval.approvedRevision ||
          approval.approvedRevision !== current.revision ||
          approval.reviewerId === current.openedById ||
          !SYNOPSIS_UUID.test(approval.reviewerId)) {
        throw new ConflictException('Persisted independent approval is missing or stale.');
      }
      const reviewer = await tx.user.findUnique({ where: { id: approval.reviewerId }, select: { role: true } });
      if (reviewer?.role !== 'ADMIN') throw new ConflictException('Review authority could not be reverified.');
      const transition = await tx.editorialCaseTransition.findUnique({
        where: { caseId_nextRevision: { caseId: current.id, nextRevision: approval.approvedRevision } },
      });
      if (!transition || transition.actorId !== approval.reviewerId || transition.action !== 'APPROVE' ||
          transition.fromState !== 'UNDER_REVIEW' || transition.toState !== 'APPROVED' ||
          transition.previousRevision !== approval.reviewedRevision ||
          transition.nextRevision !== approval.approvedRevision ||
          transition.note !== approval.reviewNote) {
        throw new ConflictException('Independent immutable approval transition is not verified.');
      }
      // Evidence was verified for the PRE-approval revision; both digests must still match.
      const evidenceDigest = verifyPersistedSynopsisEvidence(
        approval.evidence, current.id, candidate, approval.reviewedRevision, current.openedById!, new Date(),
      );
      const synopsis = strictSynopsis(candidate.normalizedPayload);
      if (approval.candidateDigest !== evidenceDigest || approval.synopsisDigest !== sha256Text(synopsis)) {
        throw new ConflictException('Persisted approved proposal differs from candidate.');
      }
      const anime = await tx.anime.findUnique({
        where: { id: current.canonicalEntityId! }, select: { id: true, description: true, updatedAt: true },
      });
      if (!anime) throw new NotFoundException('Canonical Anime missing.');
      const priorCommit = await tx.editorialSynopsisCommit.findUnique({ where: { caseId: current.id } });
      if (priorCommit) {
        if (priorCommit.approvalId !== approval.id || priorCommit.animeId !== anime.id ||
            priorCommit.afterDescription !== synopsis || anime.description !== priorCommit.afterDescription) {
          throw new ConflictException('An earlier canonical commit is incompatible with current state.');
        }
        return { caseId: current.id, commitId: priorCommit.id, status: 'ALREADY_COMMITTED' as const };
      }
      if (anime.updatedAt.getTime() !== expectedUpdatedAt.getTime() || anime.description === synopsis) {
        throw new ConflictException('Canonical timestamp changed or synopsis is already present.');
      }
      const updated = await tx.anime.updateMany({
        where: { id: anime.id, updatedAt: expectedUpdatedAt, description: anime.description },
        data: { description: synopsis },
      });
      if (updated.count !== 1) throw new ConflictException('Canonical compare-and-swap failed.');
      const finalAnime = await tx.anime.findUnique({
        where: { id: anime.id }, select: { description: true, updatedAt: true },
      });
      if (!finalAnime || finalAnime.description !== synopsis) {
        throw new ConflictException('Canonical write verification failed.');
      }
      const commit = await tx.editorialSynopsisCommit.create({
        data: {
          caseId: current.id, approvalId: approval.id, animeId: anime.id, actorId: actor.id,
          beforeDescription: anime.description, afterDescription: synopsis,
          beforeUpdatedAt: anime.updatedAt, afterUpdatedAt: finalAnime.updatedAt,
          synopsisDigest: approval.synopsisDigest,
          policyVersion: SYNOPSIS_POLICY_VERSION,
        }, select: { id: true },
      });
      // Audit insert and Anime.description CAS form one transaction: failure rolls back both.
      return { caseId: current.id, commitId: commit.id, status: 'COMMITTED' as const };
    }, { isolationLevel: 'Serializable' });
  }
}
