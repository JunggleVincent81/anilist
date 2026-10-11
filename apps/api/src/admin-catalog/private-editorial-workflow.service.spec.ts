import { describe, expect, it, jest } from '@jest/globals';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { EditorialCase } from '@prisma/client';
import type { PrismaService } from '../database/prisma.service.js';
import { PrivateEditorialWorkflowService } from './private-editorial-workflow.service.js';

const opener = 'e88c6f0b-252d-438f-a70b-dbc44f718dc1';
const reviewer = 'a7c39476-3cad-43eb-8a80-8ba50be29f9d';
const caseId = '0a2e5478-aa72-4bd5-ac03-05c94a5636b8';
const candidateId = 'eee24b95-3f95-40f6-b836-b7656d781400';

type SelectedCase = Pick<EditorialCase,
  'id' | 'state' | 'revision' | 'openedById' | 'legacyChangeRequestId' | 'candidateId' | 'subjectType'>;

function fixture(options: {
  row?: Partial<SelectedCase>;
  missing?: boolean;
  updated?: number;
} = {}) {
  const row: SelectedCase = {
    id: caseId,
    state: 'DRAFT',
    revision: 1,
    openedById: opener,
    legacyChangeRequestId: null,
    candidateId,
    subjectType: 'ANIME',
    ...options.row,
  };
  const findUnique = jest.fn(async (_args?: unknown): Promise<SelectedCase | null> => options.missing ? null : row);
  const updateMany = jest.fn(async (_args?: unknown) => ({ count: options.updated ?? 1 }));
  const tx = { editorialCase: { findUnique, updateMany } };
  const transaction = jest.fn(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx));
  const service = new PrivateEditorialWorkflowService({ $transaction: transaction } as unknown as PrismaService);
  return { service, findUnique, updateMany, transaction };
}

const submit = { caseId, action: 'SUBMIT', expectedRevision: 1 };

describe('AN-161B internal editorial service (mocked, no database)', () => {
  it('denies non-ADMIN and malformed IDs before database access', async () => {
    const h = fixture();
    await expect(h.service.transition({ id: opener, role: 'MODERATOR' }, submit)).rejects.toThrow(ForbiddenException);
    await expect(h.service.transition({ id: 'not-uuid', role: 'ADMIN' }, submit)).rejects.toThrow(ForbiddenException);
    await expect(h.service.transition({ id: opener, role: 'ADMIN' }, { ...submit, caseId: 'bad-id' })).rejects.toThrow(BadRequestException);
    await expect(h.service.transition({ id: opener, role: 'ADMIN' }, { ...submit, expectedRevision: 0 })).rejects.toThrow(BadRequestException);
    expect(h.transaction).not.toHaveBeenCalled();
  });

  it('submits an owned draft with persisted authorization and revision CAS', async () => {
    const h = fixture();
    await expect(h.service.transition({ id: opener, role: 'ADMIN' }, submit))
      .resolves.toMatchObject({ id: caseId, state: 'SUBMITTED', revision: 2, policyVersion: 'AN-161A-v1' });
    expect(h.transaction).toHaveBeenCalledTimes(1);
    expect(h.findUnique).toHaveBeenCalledWith({ where: { id: caseId }, select: expect.objectContaining({ openedById: true, legacyChangeRequestId: true }) });
    expect(h.updateMany).toHaveBeenCalledWith({
      where: { id: caseId, revision: 1, state: 'DRAFT', openedById: opener,
        legacyChangeRequestId: null, candidateId, subjectType: 'ANIME' },
      data: { state: 'SUBMITTED', revision: { increment: 1 } },
    });
  });

  it('requires a different reviewer and permits only approved policy transitions', async () => {
    const h = fixture({ row: { state: 'SUBMITTED', revision: 2 } });
    await expect(h.service.transition({ id: reviewer, role: 'ADMIN' },
      { caseId, expectedRevision: 2, action: 'BEGIN_REVIEW' }))
      .resolves.toMatchObject({ state: 'UNDER_REVIEW', revision: 3 });
    const denied = fixture({ row: { state: 'SUBMITTED', revision: 2 } });
    await expect(denied.service.transition({ id: opener, role: 'ADMIN' },
      { caseId, expectedRevision: 2, action: 'REJECT', note: 'Insufficient provenance' }))
      .rejects.toThrow(ForbiddenException);
    expect(denied.updateMany).not.toHaveBeenCalled();
  });

  it('rejects old revisions, missing cases, linked legacy workflow, and publication', async () => {
    const stale = fixture({ row: { revision: 3 } });
    await expect(stale.service.transition({ id: opener, role: 'ADMIN' }, submit)).rejects.toThrow(ConflictException);
    expect(stale.updateMany).not.toHaveBeenCalled();
    const missing = fixture({ missing: true });
    await expect(missing.service.transition({ id: opener, role: 'ADMIN' }, submit)).rejects.toThrow(NotFoundException);
    const legacy = fixture({ row: { legacyChangeRequestId: '03138766-bd07-4691-b7f9-b32e30bfc53c' } });
    await expect(legacy.service.transition({ id: opener, role: 'ADMIN' }, submit)).rejects.toThrow(ConflictException);
    expect(legacy.updateMany).not.toHaveBeenCalled();
    const publish = fixture();
    await expect(publish.service.transition({ id: opener, role: 'ADMIN' }, { ...submit, action: 'PUBLISH' })).rejects.toThrow(BadRequestException);
    expect(publish.updateMany).not.toHaveBeenCalled();
  });

  it('fails closed on compare-and-swap race and transaction failure', async () => {
    const raced = fixture({ updated: 0 });
    await expect(raced.service.transition({ id: opener, role: 'ADMIN' }, submit)).rejects.toThrow(ConflictException);
    expect(raced.updateMany).toHaveBeenCalledTimes(1);
    const broken = fixture();
    broken.updateMany.mockImplementationOnce(async () => { throw new Error('Simulated database failure'); });
    await expect(broken.service.transition({ id: opener, role: 'ADMIN' }, submit)).rejects.toThrow('Simulated database failure');
  });

  it('updates only private case state; note/audit persistence stays blocked until AN-162', async () => {
    const h = fixture({ row: { state: 'UNDER_REVIEW', revision: 3 } });
    await expect(h.service.transition({ id: reviewer, role: 'ADMIN' },
      { caseId, expectedRevision: 3, action: 'REQUEST_CHANGES', note: 'Please clarify original rights' }))
      .resolves.toMatchObject({ state: 'DRAFT', revision: 4 });
    expect(h.updateMany).toHaveBeenCalledTimes(1);
    expect(h.transaction).toHaveBeenCalledTimes(1);
  });
});
