import { describe, expect, it, jest } from '@jest/globals';
import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import type { PrismaService } from '../database/prisma.service.js';
import { PrivateEditorialApprovalService } from './private-editorial-approval.service.js';
import { candidateEvidenceDigest } from './private-synopsis-integrity.js';

const creator = '31b15186-1dd4-41fd-9392-152886471808';
const reviewer = '70c91a0b-b3b2-4603-94ac-599279889011';
const verifier = 'c7e6f5b5-d24b-4f24-baf2-3df600d39e33';
const caseId = '213f32a2-2d58-4890-a8b5-18950a3d2834';
const candidateId = 'ab8e846b-27fc-4871-80ce-e7f4030bd0ea';
const animeId = '779b8b7c-a755-4ad9-aa9e-9d80499fa8d4';
const evidenceId = '3146fc1d-783f-47fd-b397-485b0b6a32e3';
const actor = { id: reviewer, role: 'ADMIN' };
const command = { caseId, expectedRevision: 3, note: 'Source and synopsis attribution independently checked.' };

function fixture() {
  const candidate = {
    id: candidateId, subjectType: 'ANIME', sourceName: 'Curator', sourceReference: 'source-1',
    sourcePayload: { reference: 'source-1', version: 2 },
    normalizedPayload: { synopsis: 'Verified original synopsis.' },
    isQuarantined: true,
  };
  const editorialCase = {
    id: caseId, subjectType: 'ANIME', candidateId, candidate, canonicalEntityId: animeId,
    legacyChangeRequestId: null, state: 'UNDER_REVIEW', revision: 3, openedById: creator,
  };
  const evidence = {
    id: evidenceId, caseId, candidateId, caseRevision: 3,
    candidateDigest: candidateEvidenceDigest(candidate), verifiedById: verifier,
    verifier: { role: 'ADMIN' }, sourceUrl: 'https://example.org/source',
    rightsBasis: 'Human-verified rights for original curatorial synopsis',
    verifiedAt: new Date('2026-10-10T00:00:00Z'), expiresAt: new Date('2030-01-01T00:00:00Z'),
    revokedAt: null,
  };
  const userFind = jest.fn(async () => ({ role: 'ADMIN' }));
  const caseFind = jest.fn(async () => editorialCase);
  const animeFind = jest.fn(async () => ({ id: animeId }));
  const evidenceFind = jest.fn(async () => evidence);
  const updateMany = jest.fn(async (_args?: unknown) => ({ count: 1 }));
  const transitionCreate = jest.fn(async (_args?: unknown) => ({ id: 'transition-id' }));
  const approvalCreate = jest.fn(async (_args?: unknown) => ({ id: 'approval-id' }));
  const tx = {
    user: { findUnique: userFind }, editorialCase: { findUnique: caseFind, updateMany },
    anime: { findUnique: animeFind }, editorialSynopsisEvidence: { findUnique: evidenceFind },
    editorialCaseTransition: { create: transitionCreate },
    editorialSynopsisApproval: { create: approvalCreate },
  };
  const transaction = jest.fn(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx));
  const service = new PrivateEditorialApprovalService({ $transaction: transaction } as unknown as PrismaService);
  return { service, candidate, editorialCase, evidence, transaction, userFind, caseFind,
    animeFind, evidenceFind, updateMany, transitionCreate, approvalCreate };
}

describe('AN-165 private synopsis approval (unit mocks; NOT a database integration)', () => {
  it('updates only APPROVED/revision and atomically creates TWO provenance-linked approval records', async () => {
    const h = fixture();
    await expect(h.service.approve(actor, command)).resolves.toMatchObject({ state: 'APPROVED', revision: 4 });
    expect(h.updateMany).toHaveBeenCalledWith({
      where: { id: caseId, revision: 3, state: 'UNDER_REVIEW', subjectType: 'ANIME',
        candidateId, canonicalEntityId: animeId, legacyChangeRequestId: null, openedById: creator },
      data: { state: 'APPROVED', revision: { increment: 1 } },
    });
    expect(h.transitionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'APPROVE', actorId: reviewer, caseId,
        previousRevision: 3, nextRevision: 4, fromState: 'UNDER_REVIEW', toState: 'APPROVED',
        note: command.note }), select: { id: true },
    });
    expect(h.approvalCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ caseId, evidenceId, reviewerId: reviewer,
        reviewedRevision: 3, approvedRevision: 4,
        candidateDigest: candidateEvidenceDigest(h.candidate) }), select: { id: true },
    });
    expect(h.transaction).toHaveBeenCalledTimes(1);
  });
  it('denies invalid/non-admin actor and malformed note before database access', async () => {
    const h = fixture();
    await expect(h.service.approve({ id: creator, role: 'USER' }, command)).rejects.toThrow(ForbiddenException);
    await expect(h.service.approve(actor, { ...command, note: 'no' })).rejects.toThrow(BadRequestException);
    await expect(h.service.approve(actor, { ...command, expectedRevision: 0 })).rejects.toThrow(BadRequestException);
    expect(h.transaction).not.toHaveBeenCalled();
  });
  it('checks current database role instead of trusting the actor role claim', async () => {
    const h = fixture(); h.userFind.mockResolvedValueOnce({ role: 'USER' });
    await expect(h.service.approve(actor, command)).rejects.toThrow(ForbiddenException);
    expect(h.caseFind).not.toHaveBeenCalled();
  });
  it('blocks creator self-review, stale revisions, legacy cases, and non-Anime subjects', async () => {
    for (const change of [
      { openedById: reviewer }, { revision: 4 },
      { legacyChangeRequestId: creator }, { subjectType: 'MANGA_WORK' },
      { state: 'DRAFT' },
    ]) {
      const h = fixture(); Object.assign(h.editorialCase, change);
      await expect(h.service.approve(actor, command)).rejects.toThrow(ConflictException);
      expect(h.updateMany).not.toHaveBeenCalled();
    }
  });
  it('blocks missing, mismatched, revoked or expired verified evidence, without a write', async () => {
    for (const change of [
      { candidateDigest: 'f'.repeat(64) }, { caseRevision: 2 }, { revokedAt: new Date() },
      { expiresAt: new Date('2020-01-01') }, { verifiedById: creator },
      { verifier: { role: 'USER' } }, { rightsBasis: '' },
    ]) {
      const h = fixture(); Object.assign(h.evidence, change);
      await expect(h.service.approve(actor, command)).rejects.toThrow(ConflictException);
      expect(h.updateMany).not.toHaveBeenCalled();
    }
  });
  it('blocks candidate provenance mutation since evidence was verified', async () => {
    const h = fixture(); h.candidate.sourceName = 'Unverified replacement';
    await expect(h.service.approve(actor, command)).rejects.toThrow(ConflictException);
    expect(h.approvalCreate).not.toHaveBeenCalled();
  });
  it('blocks revision CAS races and never inserts audit when update loses', async () => {
    const h = fixture(); h.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(h.service.approve(actor, command)).rejects.toThrow(ConflictException);
    expect(h.approvalCreate).not.toHaveBeenCalled();
    expect(h.transitionCreate).not.toHaveBeenCalled();
  });
  it('rejects the transaction when either immutable audit insert fails', async () => {
    const a = fixture(); a.transitionCreate.mockRejectedValueOnce(new Error('audit failed'));
    await expect(a.service.approve(actor, command)).rejects.toThrow('audit failed');
    const b = fixture(); b.approvalCreate.mockRejectedValueOnce(new Error('approval audit failed'));
    await expect(b.service.approve(actor, command)).rejects.toThrow('approval audit failed');
    // Real database rollback must additionally be proven by isolated PostgreSQL integration.
  });
});
