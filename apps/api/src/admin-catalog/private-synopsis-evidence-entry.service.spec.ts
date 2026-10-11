import { readFileSync } from 'node:fs';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';
import type { PrismaService } from '../database/prisma.service.js';
import { candidateEvidenceDigest } from './private-synopsis-integrity.js';
import { PrivateSynopsisEvidenceEntryService } from './private-synopsis-evidence-entry.service.js';

const opener = '31b15186-1dd4-41fd-9392-152886471808';
const verifier = '70c91a0b-b3b2-4603-94ac-599279889011';
const caseId = '213f32a2-2d58-4890-a8b5-18950a3d2834';
const candidateId = 'ab8e846b-27fc-4871-80ce-e7f4030bd0ea';
const animeId = '779b8b7c-a755-4ad9-aa9e-9d80499fa8d4';
const actor = { id: verifier, role: 'ADMIN' };
const input = {
  caseId,
  expectedRevision: 3,
  sourceUrl: 'https://example.org/editorial-rights',
  rightsBasis: 'Independently checked original synopsis and source rights documentation.',
  expiresAt: '2030-01-01T00:00:00.000Z',
};

function fixture(options: { missing?: boolean; existing?: boolean; role?: 'ADMIN' | 'USER' } = {}) {
  const candidate = {
    id: candidateId, subjectType: 'ANIME', sourceName: 'Curator', sourceReference: 'source-1',
    sourcePayload: { reference: 'source-1', version: 2 },
    normalizedPayload: { synopsis: 'An original editorial synopsis.' }, creatorId: opener,
  };
  const editorialCase = {
    id: caseId, subjectType: 'ANIME', state: 'UNDER_REVIEW', revision: 3,
    openedById: opener, canonicalEntityId: animeId, legacyChangeRequestId: null,
    candidateId, candidate,
  };
  const userFind = jest.fn(async () => ({ role: options.role ?? 'ADMIN' }));
  const caseFind = jest.fn(async () => options.missing ? null : editorialCase);
  const animeFind = jest.fn(async () => ({ id: animeId }));
  const evidenceFind = jest.fn(async () => options.existing ? { id: 'older-evidence' } : null);
  const evidenceCreate = jest.fn(async (_args?: unknown) => ({ id: 'evidence-id' }));
  const tx = {
    user: { findUnique: userFind },
    editorialCase: { findUnique: caseFind },
    anime: { findUnique: animeFind },
    editorialSynopsisEvidence: { findUnique: evidenceFind, create: evidenceCreate },
  };
  const transaction = jest.fn(async (fn: (client: typeof tx) => Promise<unknown>, _opts?: unknown) => fn(tx));
  const service = new PrivateSynopsisEvidenceEntryService({ $transaction: transaction } as unknown as PrismaService);
  return { service, tx, candidate, editorialCase, userFind, caseFind, animeFind,
    evidenceFind, evidenceCreate, transaction };
}

describe('AN-169A private, unactionable without trusted auth adapter: human evidence attestation', () => {
  it('records independently attested provenance with server-derived digest and immutable row insert', async () => {
    const h = fixture();
    await expect(h.service.recordAttestation(actor, input)).resolves.toMatchObject({
      evidenceId: 'evidence-id', caseId, caseRevision: 3,
      policyVersion: 'AN-169A-v1', candidateDigest: candidateEvidenceDigest(h.candidate),
    });
    expect(h.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });
    expect(h.evidenceCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        caseId, candidateId, caseRevision: 3, verifiedById: verifier,
        sourceUrl: input.sourceUrl, rightsBasis: input.rightsBasis,
        candidateDigest: candidateEvidenceDigest(h.candidate),
        verifiedAt: expect.any(Date), expiresAt: new Date(input.expiresAt),
      }), select: { id: true },
    });
    const args = h.evidenceCreate.mock.calls[0]?.[0] as { data: Record<string, unknown> };
    expect(args.data).not.toHaveProperty('revokedAt');
  });

  it('denies spoofed/non-admin actor and malformed input before any DB access', async () => {
    const h = fixture();
    await expect(h.service.recordAttestation({ id: verifier, role: 'USER' }, input)).rejects.toThrow(ForbiddenException);
    await expect(h.service.recordAttestation(actor, { ...input, caseId: 'wrong' })).rejects.toThrow(BadRequestException);
    await expect(h.service.recordAttestation(actor, { ...input, expectedRevision: 0 })).rejects.toThrow(BadRequestException);
    expect(h.transaction).not.toHaveBeenCalled();
  });

  it('rechecks live persisted administrator status rather than trusting the actor object', async () => {
    const h = fixture({ role: 'USER' });
    await expect(h.service.recordAttestation(actor, input)).rejects.toThrow(ForbiddenException);
    expect(h.caseFind).not.toHaveBeenCalled();
    expect(h.evidenceCreate).not.toHaveBeenCalled();
  });

  it('refuses self-attestation, candidate creator attestation, cross-domain and legacy linkage', async () => {
    for (const mutation of [
      { openedById: verifier }, { subjectType: 'MANGA_WORK' },
      { legacyChangeRequestId: opener }, { state: 'APPROVED' },
      { revision: 2 }, { canonicalEntityId: null }, { candidateId: opener },
    ]) {
      const h = fixture(); Object.assign(h.editorialCase, mutation);
      await expect(h.service.recordAttestation(actor, input)).rejects.toThrow(ConflictException);
      expect(h.evidenceCreate).not.toHaveBeenCalled();
    }
    const h = fixture(); h.candidate.creatorId = verifier;
    await expect(h.service.recordAttestation(actor, input)).rejects.toThrow(ConflictException);
  });

  it('refuses missing cases, missing canonical targets, untrusted candidate proposal and duplicate evidence', async () => {
    await expect(fixture({ missing: true }).service.recordAttestation(actor, input)).rejects.toThrow(NotFoundException);
    const missingAnime = fixture();
    missingAnime.animeFind.mockResolvedValueOnce(null as never);
    await expect(missingAnime.service.recordAttestation(actor, input)).rejects.toThrow(NotFoundException);
    const bad = fixture(); bad.candidate.normalizedPayload = { synopsis: 'Original', isAdult: true } as never;
    await expect(bad.service.recordAttestation(actor, input)).rejects.toThrow(ConflictException);
    const duplicate = fixture({ existing: true });
    await expect(duplicate.service.recordAttestation(actor, input)).rejects.toThrow(ConflictException);
    expect(duplicate.evidenceCreate).not.toHaveBeenCalled();
  });

  it('requires an explicit HTTPS reference and substantial human rights explanation', async () => {
    for (const sourceUrl of [
      'http://example.org/source', 'https://user:pass@example.org/source',
      'https://example.org/ref#secret', ' https://example.org/source', 'javascript:alert(1)',
    ]) {
      const h = fixture();
      await expect(h.service.recordAttestation(actor, { ...input, sourceUrl })).rejects.toThrow(BadRequestException);
      expect(h.transaction).not.toHaveBeenCalled();
    }
    for (const rightsBasis of ['', 'verified', '  ', 'a'.repeat(501)]) {
      await expect(fixture().service.recordAttestation(actor, { ...input, rightsBasis })).rejects.toThrow(BadRequestException);
    }
  });

  it('rejects expired/malformed license timing rather than accepting user-supplied verification timestamps', async () => {
    for (const expiresAt of ['2020-01-01T00:00:00.000Z', 'tomorrow', '2030-01-01T00:00:00+00:00']) {
      await expect(fixture().service.recordAttestation(actor, { ...input, expiresAt })).rejects.toThrow(BadRequestException);
    }
    const h = fixture();
    const attacked = { ...input, verifiedAt: '2100-01-01T00:00:00.000Z', candidateDigest: '0'.repeat(64) };
    await h.service.recordAttestation(actor, attacked);
    const args = h.evidenceCreate.mock.calls[0]?.[0] as { data: Record<string, unknown> };
    expect(args.data).not.toHaveProperty('verifiedAt', attacked.verifiedAt);
    expect(args.data.candidateDigest).not.toEqual(attacked.candidateDigest);
  });

  it('propagates failed evidence insert; mock cannot establish a database rollback', async () => {
    const h = fixture();
    h.evidenceCreate.mockRejectedValueOnce(new Error('evidence insert unavailable'));
    await expect(h.service.recordAttestation(actor, input)).rejects.toThrow('evidence insert unavailable');
  });

  it('is unregistered from NestJS and creates no public resolver or route', () => {
    const moduleSource = readFileSync(new URL('./admin-catalog.module.ts', import.meta.url), 'utf8');
    const resolverSource = readFileSync(new URL('./admin-catalog.resolver.ts', import.meta.url), 'utf8');
    expect(moduleSource).not.toContain('PrivateSynopsisEvidenceEntryService');
    expect(resolverSource).not.toContain('PrivateSynopsisEvidenceEntryService');
    expect(resolverSource).not.toContain('recordAttestation');
  });
});
