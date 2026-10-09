import 'reflect-metadata';
import { describe, expect, it, jest } from '@jest/globals';
import { UserRole } from '@prisma/client';
import type { PrismaService } from '../database/prisma.service.js';
import { ROLES_KEY } from '../auth/authorization/roles.decorator.js';
import { RolesGuard } from '../auth/authorization/roles.guard.js';
import { AdminCatalogResolver } from './admin-catalog.resolver.js';
import { AdminSynopsisReviewService } from './admin-synopsis-review.service.js';

const id = 'ca79377a-017a-480a-8d5f-0d94a382a243';
const actor = 'a7d35dbe-b2ba-42aa-8c8d-54740e183449';
const other = 'af729d75-b45d-4fbd-9ef9-40f4d39888ef';

describe('AN-144 private synopsis workflow', () => {
  it('guards both GraphQL mutations for ADMIN only', () => {
    for (const method of ['submitAdminSynopsisDraft', 'reviewAdminSynopsisSubmission'] as const) {
      const handler = AdminCatalogResolver.prototype[method];
      expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual([UserRole.ADMIN]);
      expect(Reflect.getMetadata('__guards__', handler)).toContain(RolesGuard);
    }
  });
  it('submits only an owned DRAFT at expected revision', async () => {
    const updateMany = jest.fn(async (_args: unknown) => ({ count: 1 }));
    const service = new AdminSynopsisReviewService({ catalogChangeRequest: { updateMany } } as unknown as PrismaService);
    await expect(service.submit(actor, { draftId: id, expectedRevision: 3 })).resolves.toEqual({ id, state: 'SUBMITTED', revision: 4 });
    expect(updateMany.mock.calls[0]![0]).toMatchObject({ where: { creatorId: actor, state: 'DRAFT', revision: 3 }, data: { state: 'SUBMITTED' } });
  });
  it('rejects stale submission without writing', async () => {
    const updateMany = jest.fn(async (_args: unknown) => ({ count: 0 }));
    const service = new AdminSynopsisReviewService({ catalogChangeRequest: { updateMany } } as unknown as PrismaService);
    await expect(service.submit(actor, { draftId: id, expectedRevision: 1 })).rejects.toThrow();
  });
  it('blocks self-review and any forbidden approval action', async () => {
    const create = jest.fn(async (_args: unknown) => ({}));
    const tx = { catalogChangeRequest: { findFirst: jest.fn(async () => ({ creatorId: actor })), updateMany: jest.fn(async () => ({ count: 1 })) },
      catalogReviewDecision: { create } };
    const prisma = { $transaction: async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx) } as unknown as PrismaService;
    const service = new AdminSynopsisReviewService(prisma);
    await expect(service.review(actor, { draftId: id, expectedRevision: 2, action: 'REJECT', note: 'Needs revision' })).rejects.toThrow();
    await expect(service.review(other, { draftId: id, expectedRevision: 2, action: 'APPROVE' as 'REJECT', note: 'Needs revision' })).rejects.toThrow();
    expect(create).not.toHaveBeenCalled();
  });
  it('records human decision in same database transaction as state change', async () => {
    const create = jest.fn(async (_args: unknown) => ({}));
    const tx = { catalogChangeRequest: { findFirst: jest.fn(async () => ({ creatorId: actor })), updateMany: jest.fn(async () => ({ count: 1 })) },
      catalogReviewDecision: { create } };
    const prisma = { $transaction: async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx) } as unknown as PrismaService;
    const service = new AdminSynopsisReviewService(prisma);
    await expect(service.review(other, { draftId: id, expectedRevision: 2, action: 'REQUEST_CHANGES', note: 'Please clarify the source' }))
      .resolves.toEqual({ id, state: 'DRAFT', revision: 3 });
    expect(create.mock.calls[0]![0]).toMatchObject({ data: { actorId: other, reviewTrack: 'SYNOPSIS', action: 'REQUEST_CHANGES', draftRevision: 2 } });
  });
});
