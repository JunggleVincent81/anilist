import { createHash } from 'node:crypto';
import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';

export const SYNOPSIS_POLICY_VERSION = 'AN-165-166-v1';
export const SYNOPSIS_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const MAX_EDITORIAL_REVISION = 2147483646;

export function validatePrivateActor(actor: { id: string; role: string } | null | undefined): asserts actor is { id: string; role: string } {
  if (!actor || actor.role !== 'ADMIN' || !SYNOPSIS_UUID.test(actor.id)) {
    throw new ForbiddenException('Authenticated ADMIN context is required.');
  }
}

export function validateCaseCommand(caseId: string, revision: number): void {
  if (!SYNOPSIS_UUID.test(caseId)) throw new BadRequestException('Invalid editorial case ID.');
  if (!Number.isSafeInteger(revision) || revision < 1 || revision > MAX_EDITORIAL_REVISION) {
    throw new BadRequestException('Invalid editorial revision.');
  }
}

export function requiredReviewNote(note: unknown): string {
  if (typeof note !== 'string' || note.trim().length < 5 || note.trim().length > 2000) {
    throw new BadRequestException('An original, human review note of 5–2000 characters is required.');
  }
  return note.trim();
}

export function strictSynopsis(payload: unknown): string {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new ConflictException('A persisted, synopsis-only normalized candidate is required.');
  }
  const data = payload as Record<string, unknown>;
  if (Object.keys(data).length !== 1 || typeof data.synopsis !== 'string') {
    throw new ConflictException('Candidate must contain only the synopsis key.');
  }
  const synopsis = data.synopsis.trim();
  // eslint-disable-next-line no-control-regex -- Reject control characters from untrusted proposed text.
  if (!synopsis || synopsis.length > 10000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(synopsis)) {
    throw new ConflictException('Invalid persisted synopsis text.');
  }
  return synopsis;
}

function canonicalJson(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return JSON.stringify(value);
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map(k => `${JSON.stringify(k)}:${canonicalJson(record[k])}`).join(',')}}`;
  }
  throw new ConflictException('Candidate contains non-JSON evidence.');
}

export function sha256Text(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export type PersistedCandidateFacts = {
  id: string;
  subjectType: string;
  sourceName: string;
  sourceReference: string;
  sourcePayload: unknown;
  normalizedPayload: unknown;
};

/** Binds original source provenance and exact proposal to a human-verified evidence record. */
export function candidateEvidenceDigest(candidate: PersistedCandidateFacts): string {
  if (candidate.subjectType !== 'ANIME' || !candidate.sourceName?.trim() || !candidate.sourceReference?.trim()) {
    throw new ConflictException('Candidate provenance is incomplete or outside ANIME scope.');
  }
  const synopsis = strictSynopsis(candidate.normalizedPayload);
  return sha256Text(canonicalJson({
    candidateId: candidate.id,
    subjectType: candidate.subjectType,
    sourceName: candidate.sourceName,
    sourceReference: candidate.sourceReference,
    sourcePayload: candidate.sourcePayload,
    synopsis,
  }));
}

export type PersistedSynopsisEvidenceFacts = {
  caseId: string;
  candidateId: string;
  caseRevision: number;
  candidateDigest: string;
  verifiedById: string;
  verifier: { role: string };
  sourceUrl: string;
  rightsBasis: string;
  verifiedAt: Date;
  expiresAt: Date | null;
  revokedAt: Date | null;
};

export function verifyPersistedSynopsisEvidence(
  evidence: PersistedSynopsisEvidenceFacts | null,
  caseId: string,
  candidate: PersistedCandidateFacts,
  expectedRevision: number,
  openerId: string,
  now: Date,
): string {
  const candidateDigest = candidateEvidenceDigest(candidate);
  if (!evidence || evidence.caseId !== caseId || evidence.candidateId !== candidate.id ||
      evidence.caseRevision !== expectedRevision || evidence.candidateDigest !== candidateDigest ||
      evidence.verifier?.role !== 'ADMIN' || evidence.verifiedById === openerId ||
      !SYNOPSIS_UUID.test(evidence.verifiedById) ||
      !evidence.sourceUrl?.startsWith('https://') || evidence.rightsBasis?.trim().length < 10 ||
      !(evidence.verifiedAt instanceof Date) || !Number.isFinite(evidence.verifiedAt.getTime()) ||
      evidence.verifiedAt.getTime() > now.getTime() || evidence.revokedAt !== null ||
      (evidence.expiresAt !== null && (!(evidence.expiresAt instanceof Date) ||
        !Number.isFinite(evidence.expiresAt.getTime()) || evidence.expiresAt.getTime() <= now.getTime()))) {
    throw new ConflictException('A current, independently verified persisted synopsis provenance record is required.');
  }
  return candidateDigest;
}
