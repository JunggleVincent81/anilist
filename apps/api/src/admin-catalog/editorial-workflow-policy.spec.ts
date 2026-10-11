import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { describe, expect, it } from '@jest/globals';
import { planEditorialWorkflowTransition, type EditorialWorkflowInput } from './editorial-workflow-policy.js';

const creator = 'e88c6f0b-252d-438f-a70b-dbc44f718dc1';
const reviewer = 'a7c39476-3cad-43eb-8a80-8ba50be29f9d';
const base: EditorialWorkflowInput = {
  action: 'SUBMIT', state: 'DRAFT', revision: 1, actorId: creator,
  actorRole: 'ADMIN', openedById: creator, legacyChangeRequestId: null,
};
const plan = (partial: Partial<EditorialWorkflowInput> = {}) => planEditorialWorkflowTransition({ ...base, ...partial });

describe('AN-161A private editorial workflow policy', () => {
  it('only lets the authenticated ADMIN opener submit their own draft', () => {
    expect(plan()).toMatchObject({ expectedRevision: 1, nextRevision: 2, nextState: 'SUBMITTED', policyVersion: 'AN-161A-v1' });
    expect(() => plan({ actorRole: 'MODERATOR' })).toThrow(ForbiddenException);
    expect(() => plan({ actorRole: 'USER' })).toThrow(ForbiddenException);
    expect(() => plan({ actorId: reviewer })).toThrow(ForbiddenException);
    expect(() => plan({ openedById: null })).toThrow(ForbiddenException);
  });
  it('requires independent reviewer for entry to review', () => {
    expect(plan({ action: 'BEGIN_REVIEW', state: 'SUBMITTED', actorId: reviewer, revision: 2 }))
      .toMatchObject({ nextState: 'UNDER_REVIEW', nextRevision: 3 });
    expect(() => plan({ action: 'BEGIN_REVIEW', state: 'SUBMITTED' })).toThrow(ForbiddenException);
  });
  it('returns changes to DRAFT and records a revision, without granting publication', () => {
    expect(plan({ action: 'REQUEST_CHANGES', state: 'UNDER_REVIEW', actorId: reviewer, note: 'Clarify evidence' }))
      .toMatchObject({ nextState: 'DRAFT', nextRevision: 2 });
    expect(plan({ action: 'REJECT', state: 'SUBMITTED', actorId: reviewer, note: 'Missing provenance' }))
      .toMatchObject({ nextState: 'REJECTED', nextRevision: 2 });
  });
  it('rejects malformed review notes, invalid state transitions and revision overflow', () => {
    expect(() => plan({ action: 'REJECT', state: 'SUBMITTED', actorId: reviewer, note: '  ' })).toThrow(BadRequestException);
    expect(() => plan({ action: 'BEGIN_REVIEW', state: 'DRAFT', actorId: reviewer })).toThrow(ConflictException);
    expect(() => plan({ state: 'APPROVED' })).toThrow(ConflictException);
    expect(() => plan({ revision: Number.MAX_SAFE_INTEGER })).toThrow(BadRequestException);
    expect(() => plan({ revision: 0 })).toThrow(BadRequestException);
  });
  it('fails closed for generic approval, revocation, publication and unknown actions', () => {
    for (const action of ['APPROVE', 'PUBLISH', 'REVOKE', 'COMMIT_CANONICAL', 'UNQUARANTINE', 'INVALID']) {
      expect(() => plan({ action })).toThrow(BadRequestException);
    }
  });
  it('never takes over a linked legacy CatalogChangeRequest', () => {
    expect(() => plan({ legacyChangeRequestId: 'a7c39476-3cad-43eb-8a80-8ba50be29f9d' })).toThrow(ConflictException);
  });
  it('never mutates its input object', () => {
    const input = { ...base };
    const prior = { ...input };
    planEditorialWorkflowTransition(input);
    expect(input).toEqual(prior);
  });
});
