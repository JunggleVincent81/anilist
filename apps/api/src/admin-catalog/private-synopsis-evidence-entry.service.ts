import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { TrustedEditorialActor } from './private-editorial-workflow.service.js';
import {
  SYNOPSIS_UUID, candidateEvidenceDigest, strictSynopsis, validateCaseCommand, validatePrivateActor,
} from './private-synopsis-integrity.js';

export const PRIVATE_EVIDENCE_ENTRY_POLICY = 'AN-169A-v1' as const;

/**
 * Inputs are a human administrator's signed-off attestation, NOT automatic proof
 * of ownership or a source-rights API. No HTTP/GraphQL caller is registered.
 * A future adapter must derive actor identity from a trusted authenticated context.
 */
export type PrivateSynopsisEvidenceEntryInput = {
  caseId: string;
  expectedRevision: number;
  sourceUrl: string;
  rightsBasis: string;
  expiresAt?: string | null;
};

function validateSourceUrl(value: unknown): string {
  if (typeof value !== 'string' || value.length > 2048 || value !== value.trim()) {
    throw new BadRequestException('A canonical HTTPS source reference is required.');
  }
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' || !parsed.hostname || parsed.username || parsed.password ||
        parsed.hash || !value.startsWith('https://') || /\s/.test(value) ||
        [...value].some(character => character.charCodeAt(0) < 32)) {
      throw new Error('Invalid source URL');
    }
    return value;
  } catch {
    throw new BadRequestException('A canonical HTTPS source reference is required.');
  }
}

function validateRightsBasis(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length < 20 || value.trim().length > 500) {
    throw new BadRequestException('Describe the independently reviewed rights basis (20–500 characters).');
  }
  return value.trim();
}

function validateExpiry(value: string | null | undefined, now: Date): Date | null {
  if (value == null) return null;
  if (typeof value !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
    throw new BadRequestException('Expiry must be an exact UTC ISO timestamp.');
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== value || date.getTime() <= now.getTime()) {
    throw new BadRequestException('Evidence expiry must be a valid future timestamp.');
  }
  return date;
}

/**
 * AN-169A: private, unregistered human attestation recording into the EXISTING
 * AN-165 evidence table. Does not grant publication or wire approval/commit.
 * Real-world source authenticity still requires independent human review;
 * storing a URL or rights statement alone cannot prove the statement is true.
 */
@Injectable()
export class PrivateSynopsisEvidenceEntryService {
  constructor(private readonly prisma: PrismaService) {}

  async recordAttestation(actor: TrustedEditorialActor, input: PrivateSynopsisEvidenceEntryInput) {
    validatePrivateActor(actor);
    if (!input || typeof input.caseId !== 'string') throw new BadRequestException('Invalid evidence input.');
    validateCaseCommand(input.caseId, input.expectedRevision);
    const sourceUrl = validateSourceUrl(input.sourceUrl);
    const rightsBasis = validateRightsBasis(input.rightsBasis);
    const verifiedAt = new Date(); // server time only; never accept client-supplied verifiedAt
    const expiresAt = validateExpiry(input.expiresAt, verifiedAt);

    return this.prisma.$transaction(async tx => {
      const persistedActor = await tx.user.findUnique({
        where: { id: actor.id }, select: { role: true },
      });
      if (persistedActor?.role !== 'ADMIN') throw new ForbiddenException('An active ADMIN must attest evidence.');

      const current = await tx.editorialCase.findUnique({
        where: { id: input.caseId }, include: { candidate: true },
      });
      if (!current) throw new NotFoundException('Editorial case not found.');
      if (current.subjectType !== 'ANIME' || current.state !== 'UNDER_REVIEW' ||
          current.revision !== input.expectedRevision || current.legacyChangeRequestId !== null ||
          !current.candidate || current.candidate.subjectType !== 'ANIME' ||
          current.candidateId !== current.candidate.id ||
          !SYNOPSIS_UUID.test(current.openedById ?? '') ||
          !SYNOPSIS_UUID.test(current.canonicalEntityId ?? '') ||
          current.openedById === actor.id || current.candidate.creatorId === actor.id) {
        throw new ConflictException('Independent evidence attestation is not permitted for this case.');
      }
      // A legitimate evidence record must reference the current, persisted Anime.
      const anime = await tx.anime.findUnique({
        where: { id: current.canonicalEntityId! }, select: { id: true },
      });
      if (!anime) throw new NotFoundException('Canonical Anime not found.');
      // No endpoint or user-supplied digest can influence the persisted fingerprint.
      strictSynopsis(current.candidate.normalizedPayload);
      const candidateDigest = candidateEvidenceDigest(current.candidate);

      const existing = await tx.editorialSynopsisEvidence.findUnique({ where: { caseId: current.id }, select: { id: true } });
      if (existing) throw new ConflictException('Case evidence already exists; rewriting verified evidence is forbidden.');

      const created = await tx.editorialSynopsisEvidence.create({
        data: {
          caseId: current.id,
          candidateId: current.candidate.id,
          caseRevision: current.revision,
          verifiedById: actor.id,
          sourceUrl,
          rightsBasis,
          candidateDigest,
          verifiedAt,
          expiresAt,
        },
        select: { id: true },
      });
      return {
        evidenceId: created.id,
        caseId: current.id,
        caseRevision: current.revision,
        candidateDigest,
        policyVersion: PRIVATE_EVIDENCE_ENTRY_POLICY,
        status: 'HUMAN_ATTESTATION_RECORDED' as const,
      };
    }, { isolationLevel: 'Serializable' });
  }
}
