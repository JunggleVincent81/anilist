import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { TrustedEditorialActor } from './private-editorial-workflow.service.js';
import {
  SYNOPSIS_POLICY_VERSION, SYNOPSIS_UUID, candidateEvidenceDigest, requiredReviewNote, sha256Text,
  strictSynopsis, validateCaseCommand, validatePrivateActor, verifyPersistedSynopsisEvidence,
} from './private-synopsis-integrity.js';

export type PrivateSynopsisApproveInput = { caseId: string; expectedRevision: number; note: string };

/**
 * AN-165: separate INTERNAL approval command; intentionally not registered in NestJS.
 * Never accept actor identity, evidence flags, or source facts from HTTP/GraphQL input.
 * A future trusted caller must authenticate the actor before invoking this command.
 */
@Injectable()
export class PrivateEditorialApprovalService {
  constructor(private readonly prisma: PrismaService) {}

  async approve(actor: TrustedEditorialActor, input: PrivateSynopsisApproveInput) {
    validatePrivateActor(actor);
    if (!input || typeof input.caseId !== 'string') throw new BadRequestException('Invalid approval input.');
    validateCaseCommand(input.caseId, input.expectedRevision);
    const note = requiredReviewNote(input.note);
    return this.prisma.$transaction(async tx => {
      const dbActor = await tx.user.findUnique({ where: { id: actor.id }, select: { role: true } });
      if (dbActor?.role !== 'ADMIN') throw new ForbiddenException('Actor is no longer an administrator.');
      const current = await tx.editorialCase.findUnique({
        where: { id: input.caseId }, include: { candidate: true },
      });
      if (!current) throw new NotFoundException('Editorial case not found.');
      if (current.subjectType !== 'ANIME' || current.legacyChangeRequestId !== null ||
          current.state !== 'UNDER_REVIEW' || current.revision !== input.expectedRevision ||
          current.revision >= 2147483646 || !current.candidate ||
          !SYNOPSIS_UUID.test(current.openedById ?? '') ||
          current.openedById === actor.id || !SYNOPSIS_UUID.test(current.canonicalEntityId ?? '')) {
        throw new ConflictException('Case is not eligible for separate ANIME synopsis approval.');
      }
      const candidate = current.candidate;
      if (current.candidateId !== candidate.id || candidate.subjectType !== 'ANIME') {
        throw new ConflictException('Candidate/case subject mismatch.');
      }
      const anime = await tx.anime.findUnique({ where: { id: current.canonicalEntityId! }, select: { id: true } });
      if (!anime) throw new NotFoundException('Canonical Anime target not found.');
      const evidence = await tx.editorialSynopsisEvidence.findUnique({
        where: { caseId: current.id }, include: { verifier: { select: { role: true } } },
      });
      const evidenceDigest = verifyPersistedSynopsisEvidence(
        evidence, current.id, candidate, current.revision, current.openedById!, new Date(),
      );
      if (evidenceDigest !== candidateEvidenceDigest(candidate)) throw new ConflictException('Candidate provenance changed.');
      const synopsis = strictSynopsis(candidate.normalizedPayload);
      const changed = await tx.editorialCase.updateMany({
        where: {
          id: current.id, revision: current.revision, state: 'UNDER_REVIEW',
          subjectType: 'ANIME', candidateId: candidate.id, canonicalEntityId: anime.id,
          legacyChangeRequestId: null, openedById: current.openedById,
        },
        data: { state: 'APPROVED', revision: { increment: 1 } },
      });
      if (changed.count !== 1) throw new ConflictException('Editorial case changed during approval.');
      // SQL checks permit ONLY UNDER_REVIEW -> APPROVED with a human reason.
      const transition = await tx.editorialCaseTransition.create({
        data: {
          caseId: current.id, actorId: actor.id, action: 'APPROVE',
          fromState: 'UNDER_REVIEW', toState: 'APPROVED',
          previousRevision: current.revision, nextRevision: current.revision + 1,
          policyVersion: SYNOPSIS_POLICY_VERSION, note,
        }, select: { id: true },
      });
      const approval = await tx.editorialSynopsisApproval.create({
        data: {
          caseId: current.id, evidenceId: evidence!.id, animeId: anime.id,
          reviewerId: actor.id, reviewedRevision: current.revision,
          approvedRevision: current.revision + 1,
          candidateDigest: evidenceDigest, synopsisDigest: sha256Text(synopsis),
          reviewNote: note,
        }, select: { id: true },
      });
      // Any failure above aborts the entire Prisma transaction, including the CAS update.
      return { caseId: current.id, state: 'APPROVED' as const, revision: current.revision + 1,
        approvalId: approval.id, transitionId: transition.id, policyVersion: SYNOPSIS_POLICY_VERSION };
    }, { isolationLevel: 'Serializable' });
  }
}
