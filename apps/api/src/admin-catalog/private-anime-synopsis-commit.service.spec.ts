import { describe, expect, it, jest } from '@jest/globals';
import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import type { PrismaService } from '../database/prisma.service.js';
import { PrivateAnimeSynopsisCommitService } from './private-anime-synopsis-commit.service.js';
import { candidateEvidenceDigest, sha256Text } from './private-synopsis-integrity.js';

const creator = '31b15186-1dd4-41fd-9392-152886471808';
const reviewer = '70c91a0b-b3b2-4603-94ac-599279889011';
const committer = 'c7e6f5b5-d24b-4f24-baf2-3df600d39e33';
const caseId = '213f32a2-2d58-4890-a8b5-18950a3d2834';
const candidateId = 'ab8e846b-27fc-4871-80ce-e7f4030bd0ea';
const animeId = '779b8b7c-a755-4ad9-aa9e-9d80499fa8d4';
const stamp = '2026-10-11T10:00:00.000Z';
const synopsis = 'Verified original synopsis.';
const actor = { id: committer, role: 'ADMIN' };
const command = { caseId, expectedRevision: 4, expectedAnimeUpdatedAt: stamp };

function fixture() {
  const candidate = {
    id: candidateId, subjectType: 'ANIME', sourceName: 'Curator', sourceReference: 'source-1',
    sourcePayload: { reference: 'source-1', version: 2 },
    normalizedPayload: { synopsis }, isQuarantined: true,
  };
  const editorialCase = {
    id: caseId, subjectType: 'ANIME', candidateId, candidate,
    canonicalEntityId: animeId, legacyChangeRequestId: null, state: 'APPROVED',
    revision: 4, openedById: creator,
  };
  const evidence = {
    caseId, candidateId, caseRevision: 3, candidateDigest: candidateEvidenceDigest(candidate),
    verifiedById: committer, verifier: { role: 'ADMIN' }, sourceUrl: 'https://example.org/source',
    rightsBasis: 'Human-verified rights for original curatorial synopsis',
    verifiedAt: new Date('2026-10-10T00:00:00Z'), expiresAt: new Date('2030-01-01'), revokedAt: null,
  };
  const approval = {
    id: 'approval-id', caseId, animeId, reviewerId: reviewer, reviewedRevision: 3,
    approvedRevision: 4, candidateDigest: evidence.candidateDigest,
    synopsisDigest: sha256Text(synopsis), reviewNote: 'Verified editorial reason', evidence,
  };
  const transition = {
    actorId: reviewer, action: 'APPROVE', fromState: 'UNDER_REVIEW', toState: 'APPROVED',
    previousRevision: 3, nextRevision: 4, note: approval.reviewNote,
  };
  const anime = { id: animeId, description: 'Old description', updatedAt: new Date(stamp) };
  const userFind = jest.fn(async () => ({ role: 'ADMIN' }));
  const caseFind = jest.fn(async () => editorialCase);
  const approvalFind = jest.fn(async () => approval);
  const transitionFind = jest.fn(async () => transition);
  const existingFind = jest.fn(async (): Promise<unknown> => null);
  const updateMany = jest.fn(async (_args?: unknown) => ({ count: 1 }));
  const animeFind = jest.fn(async () => updateMany.mock.calls.length
    ? { ...anime, description: synopsis, updatedAt: new Date('2026-10-11T10:00:01Z') } : anime);
  const commitCreate = jest.fn(async (_args?: unknown) => ({ id: 'commit-id' }));
  const tx = {
    user: { findUnique: userFind }, editorialCase: { findUnique: caseFind },
    editorialSynopsisApproval: { findUnique: approvalFind },
    editorialCaseTransition: { findUnique: transitionFind },
    anime: { findUnique: animeFind, updateMany },
    editorialSynopsisCommit: { findUnique: existingFind, create: commitCreate },
  };
  const transaction = jest.fn(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx));
  const service = new PrivateAnimeSynopsisCommitService({ $transaction: transaction } as unknown as PrismaService);
  return { service, candidate, editorialCase, approval, evidence, transition,
    anime, userFind, caseFind, approvalFind, transitionFind, animeFind, existingFind,
    updateMany, commitCreate, transaction };
}

describe('AN-166 separate, internal Anime.description writer (mocked)', () => {
  it('performs exact description-only CAS and snapshots before/after inside one transaction', async () => {
    const h = fixture();
    await expect(h.service.commit(actor, command)).resolves.toMatchObject({ status: 'COMMITTED', commitId: 'commit-id' });
    expect(h.updateMany).toHaveBeenCalledWith({
      where: { id: animeId, updatedAt: new Date(stamp), description: 'Old description' },
      data: { description: synopsis },
    });
    expect(h.commitCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        caseId, approvalId: 'approval-id', animeId, actorId: committer,
        beforeDescription: 'Old description', afterDescription: synopsis,
        beforeUpdatedAt: new Date(stamp), synopsisDigest: sha256Text(synopsis),
      }), select: { id: true },
    });
    const updateArgs = h.updateMany.mock.calls[0]?.[0] as { data: Record<string, unknown> };
    expect(Object.keys(updateArgs.data)).toEqual(['description']);
    expect(h.transaction).toHaveBeenCalledTimes(1);
  });
  it('rejects spoofed role and malformed canonical CAS token before any database access', async () => {
    const h = fixture();
    await expect(h.service.commit({ id: committer, role: 'USER' }, command)).rejects.toThrow(ForbiddenException);
    await expect(h.service.commit(actor, { ...command, expectedAnimeUpdatedAt: 'yesterday' })).rejects.toThrow(BadRequestException);
    expect(h.transaction).not.toHaveBeenCalled();
  });
  it('rechecks persisted actor role instead of trusting the input', async () => {
    const h = fixture(); h.userFind.mockResolvedValueOnce({ role: 'USER' });
    await expect(h.service.commit(actor, command)).rejects.toThrow(ForbiddenException);
    expect(h.caseFind).not.toHaveBeenCalled();
  });
  it('rejects missing persisted approval, stale revision and legacy linkage', async () => {
    const h = fixture(); h.editorialCase.revision = 5;
    await expect(h.service.commit(actor, command)).rejects.toThrow(ConflictException);
    const b = fixture(); b.approvalFind.mockResolvedValueOnce(null as never);
    await expect(b.service.commit(actor, command)).rejects.toThrow(ConflictException);
    const c = fixture(); c.editorialCase.legacyChangeRequestId = creator as never;
    await expect(c.service.commit(actor, command)).rejects.toThrow(ConflictException);
  });
  it('requires matching immutable approval event; never trusts a claimed APPROVED state alone', async () => {
    for (const change of [
      { action: 'REJECT' }, { actorId: creator },
      { nextRevision: 5 }, { note: 'Different note' },
    ]) {
      const h = fixture(); Object.assign(h.transition, change);
      await expect(h.service.commit(actor, command)).rejects.toThrow(ConflictException);
      expect(h.updateMany).not.toHaveBeenCalled();
    }
  });
  it('refuses replaced candidate data, revoked evidence and expired rights', async () => {
    const a = fixture(); a.candidate.sourceReference = 'modified';
    await expect(a.service.commit(actor, command)).rejects.toThrow(ConflictException);
    const b = fixture(); b.evidence.revokedAt = new Date('2026-10-11') as never;
    await expect(b.service.commit(actor, command)).rejects.toThrow(ConflictException);
    const c = fixture(); c.evidence.expiresAt = new Date('2020-01-01');
    await expect(c.service.commit(actor, command)).rejects.toThrow(ConflictException);
  });
  it('fails closed on stale canonical timestamp or compare-and-swap loss', async () => {
    const h = fixture(); h.anime.updatedAt = new Date('2026-10-11T10:01:00Z');
    await expect(h.service.commit(actor, command)).rejects.toThrow(ConflictException);
    const b = fixture(); b.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(b.service.commit(actor, command)).rejects.toThrow(ConflictException);
    expect(b.commitCreate).not.toHaveBeenCalled();
  });
  it('returns idempotent retry without any new write when exact prior commit is still effective', async () => {
    const h = fixture(); h.anime.description = synopsis;
    h.existingFind.mockResolvedValueOnce({ id: 'prior-id', approvalId: 'approval-id', animeId,
      afterDescription: synopsis });
    await expect(h.service.commit(actor, command)).resolves.toMatchObject({ status: 'ALREADY_COMMITTED', commitId: 'prior-id' });
    expect(h.updateMany).not.toHaveBeenCalled();
    expect(h.commitCreate).not.toHaveBeenCalled();
  });
  it('rejects incompatible duplicate commit, not silently overwriting canonical fields', async () => {
    const h = fixture(); h.existingFind.mockResolvedValueOnce({ id: 'prior-id', approvalId: 'other',
      animeId, afterDescription: 'someone else' });
    await expect(h.service.commit(actor, command)).rejects.toThrow(ConflictException);
    expect(h.updateMany).not.toHaveBeenCalled();
  });
  it('aborts transaction when immutable commit audit insert fails', async () => {
    const h = fixture(); h.commitCreate.mockRejectedValueOnce(new Error('audit persistence failed'));
    await expect(h.service.commit(actor, command)).rejects.toThrow('audit persistence failed');
    expect(h.updateMany).toHaveBeenCalledTimes(1);
    // Mock does not establish SQL rollback. Separate isolated PostgreSQL rehearsal is necessary.
  });
});
