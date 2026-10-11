import 'reflect-metadata';
import { describe, expect, it, jest } from '@jest/globals';
import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../auth/authorization/roles.decorator.js';
import { RolesGuard } from '../auth/authorization/roles.guard.js';
import type { PrismaService } from '../database/prisma.service.js';
import { AdminCatalogResolver } from './admin-catalog.resolver.js';
import { AdminAnimeCandidatesService } from './admin-anime-candidates.service.js';

const actor = '1734d284-0b04-48e4-b593-65e6d6d2744c';
const candidateId = '276f04cb-04f4-4e63-a8d3-e763bf429b36';
const stamp = new Date('2026-10-11T13:00:00.000Z');
const draft = { sourceName: 'Human curator', sourceReference: 'https://example.org/entry', synopsis: 'A private proposed synopsis.' };
const row = { id: candidateId, subjectType: 'ANIME', sourceName: draft.sourceName,
  sourceReference: draft.sourceReference, sourcePayload: { entryType: 'MANUAL_ANIME_DRAFT', sourceReference: draft.sourceReference }, fingerprint: null, normalizedPayload: { synopsis: draft.synopsis },
  isQuarantined: true, creatorId: actor, createdAt: stamp, updatedAt: stamp,
  _count: { editorialCases: 0, synopsisEvidence: 0 } };
function fixture() {
  const user = jest.fn(async (): Promise<{ role: UserRole }> => ({ role: UserRole.ADMIN }));
  const count = jest.fn(async () => 1);
  const list = jest.fn(async (_args?: unknown) => [row]);
  const create = jest.fn(async (_args?: unknown) => row);
  const find = jest.fn(async (): Promise<unknown> => row);
  const update = jest.fn(async (_args?: unknown) => ({ count: 1 }));
  const prisma = { user: { findUnique: user }, catalogCandidate: {
    count, findMany: list, create, findUnique: find, updateMany: update },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn({ catalogCandidate: { findUnique: find, updateMany: update } }),
  };
  const service = new AdminAnimeCandidatesService(prisma as unknown as PrismaService);
  return { service, user, count, list, create, find, update };
}

describe('P16-W02 private anime candidate manager', () => {
  it('protects every new query/mutation with ADMIN role metadata and RolesGuard', () => {
    for (const name of ['adminAnimeCandidatePage', 'createAdminAnimeCandidate', 'updateAdminAnimeCandidate'] as const) {
      const method = AdminCatalogResolver.prototype[name];
      expect(Reflect.getMetadata(ROLES_KEY, method)).toEqual([UserRole.ADMIN]);
      expect(Reflect.getMetadata('__guards__', method)).toContain(RolesGuard);
    }
  });
  it('lists only ANIME, owner-filtered by default; never returns sourcePayload', async () => {
    const f = fixture();
    const result = await f.service.page(actor, { page: 1, perPage: 20 });
    expect(result.items[0]).toMatchObject({ id: candidateId, editable: true, isQuarantined: true });
    expect(JSON.stringify(result)).not.toContain('sourcePayload');
    expect(f.list).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({
      subjectType: 'ANIME', creatorId: actor,
    }) }));
  });
  it('rejects invalid pagination before touching database', async () => {
    const f = fixture();
    await expect(f.service.page(actor, { page: -1 })).rejects.toThrow(BadRequestException);
    await expect(f.service.page(actor, { perPage: 51 })).rejects.toThrow(BadRequestException);
    await expect(f.service.page(actor, { search: 'x'.repeat(121) })).rejects.toThrow(BadRequestException);
    expect(f.user).not.toHaveBeenCalled();
  });
  it('creates only a quarantined private ANIME draft without evidence, publication or canonical writes', async () => {
    const f = fixture();
    await f.service.create(actor, draft);
    expect(f.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      subjectType: 'ANIME', creatorId: actor, isQuarantined: true,
      normalizedPayload: { synopsis: draft.synopsis },
    }) }));
    const args = f.create.mock.calls[0]?.[0] as { data: Record<string, unknown> };
    expect(Object.keys(args.data).sort()).toEqual([
      'creatorId', 'isQuarantined', 'normalizedPayload', 'sourceName', 'sourcePayload', 'sourceReference', 'subjectType',
    ]);
    expect(JSON.stringify(args.data)).not.toMatch(/isAdult|catalogStatus|isPublished|rightsBasis/);
  });
  it('requires persisted ADMIN and rejects invalid source/synopsis fields', async () => {
    const f = fixture(); f.user.mockResolvedValueOnce({ role: UserRole.USER });
    await expect(f.service.create(actor, draft)).rejects.toThrow(ForbiddenException);
    expect(f.create).not.toHaveBeenCalled();
    const g = fixture();
    await expect(g.service.create(actor, { ...draft, synopsis: '  ' })).rejects.toThrow(BadRequestException);
    expect(g.user).not.toHaveBeenCalled();
  });
  it('uses owner, quarantine, subject, evidence/case absence and exact timestamp CAS', async () => {
    const f = fixture();
    await f.service.update(actor, { ...draft, candidateId, expectedUpdatedAt: stamp.toISOString() });
    expect(f.update).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({
      subjectType: 'ANIME', creatorId: actor, isQuarantined: true, fingerprint: null, updatedAt: stamp,
      editorialCases: { none: {} }, synopsisEvidence: { none: {} },
    }) }));
  });
  it('rejects stale token, foreign owner and linked editorial review', async () => {
    const a = fixture();
    await expect(a.service.update(actor, { ...draft, candidateId, expectedUpdatedAt: 'bad' })).rejects.toThrow(BadRequestException);
    const b = fixture(); b.find.mockResolvedValueOnce({ ...row, creatorId: candidateId });
    await expect(b.service.update(actor, { ...draft, candidateId, expectedUpdatedAt: stamp.toISOString() })).rejects.toThrow(ConflictException);
    const c = fixture(); c.find.mockResolvedValueOnce({ ...row, _count: { editorialCases: 1, synopsisEvidence: 0 } });
    await expect(c.service.update(actor, { ...draft, candidateId, expectedUpdatedAt: stamp.toISOString() })).rejects.toThrow(ConflictException);
    const x = fixture(); x.find.mockResolvedValueOnce({ ...row, sourcePayload: {entryType:'IMPORTED'} });
    await expect(x.service.update(actor, { ...draft, candidateId, expectedUpdatedAt: stamp.toISOString() })).rejects.toThrow(ConflictException);
    const d = fixture(); d.update.mockResolvedValueOnce({ count: 0 });
    await expect(d.service.update(actor, { ...draft, candidateId, expectedUpdatedAt: stamp.toISOString() })).rejects.toThrow(ConflictException);
  });
});
