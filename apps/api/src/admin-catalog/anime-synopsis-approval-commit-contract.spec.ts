import { describe, expect, it } from '@jest/globals';
import {
  assessAnimeSynopsisApproval,
  assessAnimeSynopsisCanonicalCommit,
  type AnimeSynopsisApprovalFacts,
  type AnimeSynopsisCommitFacts,
} from './anime-synopsis-approval-commit-contract.js';

const creator = '31b15186-1dd4-41fd-9392-152886471808';
const reviewer = '70c91a0b-b3b2-4603-94ac-599279889011';
const committer = 'c7e6f5b5-d24b-4f24-baf2-3df600d39e33';
const caseCandidate = '213f32a2-2d58-4890-a8b5-18950a3d2834';
const animeId = 'ab8e846b-27fc-4871-80ce-e7f4030bd0ea';
const stamp = '2026-10-11T10:00:00.000Z';

const approval: AnimeSynopsisApprovalFacts = {
  subjectType: 'ANIME', editorialCaseState: 'UNDER_REVIEW', editorialCaseRevision: 3,
  legacyChangeRequestId: null, candidateId: caseCandidate,
  openerId: creator, proposedPatch: { synopsis: 'An original curator-written synopsis.' },
  reviewerId: reviewer, reviewerRole: 'ADMIN', reviewerDecision: 'APPROVE',
  reviewerNote: 'Verified editorial review.', provenanceEvidenceVerified: true,
};
const commit: AnimeSynopsisCommitFacts = {
  ...approval, editorialCaseState: 'APPROVED', actorId: committer, actorRole: 'ADMIN',
  canonicalAnimeId: animeId, approvalReviewerId: reviewer, approvalCaseRevision: 3,
  approvalAuditPersisted: true, canonicalRecordExists: true,
  expectedCanonicalUpdatedAt: stamp, observedCanonicalUpdatedAt: stamp,
};
const review = (v: Partial<AnimeSynopsisApprovalFacts> = {}) => assessAnimeSynopsisApproval({ ...approval, ...v });
const apply = (v: Partial<AnimeSynopsisCommitFacts> = {}) => assessAnimeSynopsisCanonicalCommit({ ...commit, ...v });

describe('AN-164 inactive ANIME synopsis contract', () => {
  it('never grants approval, canonical write or publication on complete-looking facts', () => {
    for (const result of [review(), apply()]) {
      expect(result.policyVersion).toBe('AN-164-v1');
      expect(result.status).toBe('BLOCKED');
      expect(result.canApprove).toBe(false);
      expect(result.canWriteCanonical).toBe(false);
      expect(result.canPublish).toBe(false);
    }
    expect(review().reasons).toContain('APPROVAL_ACTION_NOT_IMPLEMENTED');
    expect(apply().reasons).toContain('CANONICAL_COMMIT_NOT_IMPLEMENTED');
  });

  it('rejects self review, non-admin reviewers and missing human reason', () => {
    expect(review({ reviewerId: creator }).reasons).toContain('INDEPENDENT_REVIEWER_REQUIRED');
    expect(review({ reviewerRole: 'USER' }).reasons).toContain('REVIEWER_ADMIN_REQUIRED');
    expect(review({ reviewerNote: 'no' }).reasons).toContain('HUMAN_REVIEW_NOTE_REQUIRED');
  });

  it('requires review state and a distinct explicit approval decision', () => {
    expect(review({ editorialCaseState: 'DRAFT' }).reasons).toContain('HUMAN_REVIEW_STATE_REQUIRED');
    expect(review({ reviewerDecision: 'REJECT' }).reasons).toContain('EXPLICIT_APPROVAL_DECISION_REQUIRED');
    expect(review({ provenanceEvidenceVerified: false }).reasons).toContain('PROVENANCE_UNVERIFIED');
  });

  it('requires strict ANIME-only scope, never touches generic other domains', () => {
    for (const subjectType of ['ANIME_EPISODE','MANGA_WORK','MANGA_VOLUME','MANGA_CHAPTER','MUSIC_TRACK','MUSIC_RECORDING','MUSIC_RELEASE','MUSIC_ARTIST','UNKNOWN']) {
      expect(review({ subjectType }).reasons).toContain('ANIME_ONLY');
      expect(apply({ subjectType }).reasons).toContain('ANIME_ONLY');
    }
  });

  it('keeps legacy synopsis workflow separate from generic editorial cases', () => {
    expect(review({ legacyChangeRequestId: creator }).reasons).toContain('LEGACY_WORKFLOW_SEPARATE');
    expect(apply({ legacyChangeRequestId: creator }).reasons).toContain('LEGACY_WORKFLOW_SEPARATE');
  });

  it('accepts only one synopsis text key as a proposal shape', () => {
    for (const proposedPatch of [
      {}, { synopsis: '' }, { synopsis: '  ' }, { synopsis: 5 },
      { description: 'attempt' }, { synopsis: 'fine', isAdult: false },
      { synopsis: 'fine', slug: 'new-slug' }, { synopsis: 'fine', coverImageUrl: 'https://x' },
      { synopsis: 'bad\u0000character' }, { synopsis: 'a'.repeat(10001) }, null, [],
    ]) {
      expect(review({ proposedPatch }).reasons).toContain('SYNOPSIS_ONLY_PATCH_REQUIRED');
      expect(apply({ proposedPatch }).reasons).toContain('SYNOPSIS_ONLY_PATCH_REQUIRED');
    }
  });

  it('rejects invalid case revisions and missing provenance linkage', () => {
    expect(review({ editorialCaseRevision: 0 }).reasons).toContain('EDITORIAL_REVISION_INVALID');
    expect(review({ candidateId: null }).reasons).toContain('CANDIDATE_ID_INVALID');
    expect(review({ openerId: null }).reasons).toContain('OPENER_ID_INVALID');
  });

  it('never treats a claimed approved state as a persisted verified decision', () => {
    expect(apply({ editorialCaseState: 'UNDER_REVIEW' }).reasons).toContain('PERSISTED_APPROVAL_REQUIRED');
    expect(apply({ approvalAuditPersisted: false }).reasons).toContain('DURABLE_APPROVAL_AUDIT_REQUIRED');
    expect(apply({ approvalCaseRevision: 2 }).reasons).toContain('APPROVAL_REVISION_MISMATCH');
    expect(apply({ approvalReviewerId: creator }).reasons).toContain('INDEPENDENT_APPROVAL_REVIEWER_REQUIRED');
  });

  it('requires a validated committer and an existing canonical Anime target', () => {
    expect(apply({ actorRole: 'USER' }).reasons).toContain('COMMITTER_AUTH_REQUIRED');
    expect(apply({ canonicalAnimeId: null }).reasons).toContain('EXISTING_CANONICAL_ANIME_REQUIRED');
    expect(apply({ canonicalRecordExists: false }).reasons).toContain('EXISTING_CANONICAL_ANIME_REQUIRED');
  });

  it('identifies stale/missing canonical concurrency markers but does not perform a CAS', () => {
    expect(apply({ observedCanonicalUpdatedAt: '2026-10-11T11:00:00.000Z' }).reasons).toContain('CANONICAL_OPTIMISTIC_LOCK_NOT_VERIFIED');
    expect(apply({ expectedCanonicalUpdatedAt: null }).reasons).toContain('CANONICAL_OPTIMISTIC_LOCK_NOT_VERIFIED');
    expect(apply({ expectedCanonicalUpdatedAt: 'not-a-date' }).reasons).toContain('CANONICAL_OPTIMISTIC_LOCK_NOT_VERIFIED');
  });

  it('cannot be turned into an authorization token through caller-controlled evidence', () => {
    const decision = apply({ provenanceEvidenceVerified: true, approvalAuditPersisted: true });
    expect(decision.status).toBe('BLOCKED');
    expect(decision.canWriteCanonical).toBe(false);
    expect(decision.canPublish).toBe(false);
    expect(decision.reasons).toContain('APPROVAL_AND_CANONICAL_WRITES_REQUIRE_SEPARATE_AUDITED_COMMANDS');
  });

  it('does not mutate caller-provided proposal/evidence', () => {
    const original = structuredClone(commit);
    apply();
    assessAnimeSynopsisCanonicalCommit(commit);
    expect(commit).toEqual(original);
    const approvalCopy = structuredClone(approval);
    assessAnimeSynopsisApproval(approval);
    expect(approval).toEqual(approvalCopy);
  });
});
