import 'reflect-metadata';
import { describe, expect, it, jest } from '@jest/globals';
import { CatalogChangeKind, CatalogChangeState, UserRole } from '@prisma/client';
import type { PrismaService } from '../database/prisma.service.js';
import { ROLES_KEY } from '../auth/authorization/roles.decorator.js';
import { RolesGuard } from '../auth/authorization/roles.guard.js';
import { AdminCatalogResolver } from './admin-catalog.resolver.js';
import { AdminSynopsisDraftService } from './admin-synopsis-draft.service.js';

const actor = 'a7d35dbe-b2ba-42aa-8c8d-54740e183449';
const animeId = 'ca79377a-017a-480a-8d5f-0d94a382a243';
const draftId = 'af729d75-b45d-4fbd-9ef9-40f4d39888ef';
const now = new Date('2026-10-09T00:00:00.000Z');
const row = { id: draftId, animeId, creatorId: actor, revision: 1, kind: CatalogChangeKind.SYNOPSIS,
  state: CatalogChangeState.DRAFT, proposedPatch: { synopsis: 'Original text' }, reason: null,
  createdAt: now, updatedAt: now };

describe('AN-142 private synopsis draft foundation', () => {
  it('requires ADMIN for every draft endpoint', () => {
    for (const method of ['createAdminSynopsisDraft', 'adminSynopsisDraft', 'updateAdminSynopsisDraft'] as const) {
      const handler = AdminCatalogResolver.prototype[method];
      expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual([UserRole.ADMIN]);
      expect(Reflect.getMetadata('__guards__', handler)).toContain(RolesGuard);
    }
  });
  it('writes only private DRAFT proposals; not canonical anime fields', async () => {
    const create = jest.fn(async (_arg: unknown) => row);
    const prisma = { anime: { findUnique: jest.fn(async () => ({ id: animeId, updatedAt: now })) },
      catalogChangeRequest: { create } } as unknown as PrismaService;
    const result = await new AdminSynopsisDraftService(prisma).create(actor, { animeId, synopsis: ' Original text ' });
    expect(result.synopsis).toBe('Original text');
    const args = create.mock.calls[0]![0] as { data: { state: string; creatorId: string; proposedPatch: { synopsis: string } } };
    expect(args.data).toMatchObject({ state: 'DRAFT', creatorId: actor, proposedPatch: { synopsis: 'Original text' } });
    expect(Object.keys(prisma)).toEqual(['anime', 'catalogChangeRequest']);
  });
  it('rejects invalid or excessively long synopsis before persistence', async () => {
    const service = new AdminSynopsisDraftService({} as PrismaService);
    await expect(service.create(actor, { animeId, synopsis: '  ' })).rejects.toThrow();
    await expect(service.create(actor, { animeId, synopsis: 'x'.repeat(10001) })).rejects.toThrow();
  });
  it('updates using ownership, draft state and optimistic revision; rejects stale edits', async () => {
    const updateMany = jest.fn(async (_args: unknown) => ({ count: 0 }));
    const service = new AdminSynopsisDraftService({ catalogChangeRequest: { updateMany } } as unknown as PrismaService);
    await expect(service.update(actor, { draftId, expectedRevision: 1, synopsis: 'New text' })).rejects.toThrow();
    expect(updateMany.mock.calls[0]![0]).toMatchObject({ where: { id: draftId, creatorId: actor, state: 'DRAFT', revision: 1 },
      data: { revision: { increment: 1 }, proposedPatch: { synopsis: 'New text' } } });
  });
  it('hides drafts not owned by the authenticated ADMIN', async () => {
    const service = new AdminSynopsisDraftService({ catalogChangeRequest: {
      findFirst: jest.fn(async () => null),
    } } as unknown as PrismaService);
    await expect(service.mine(actor, draftId)).rejects.toThrow();
  });
});
