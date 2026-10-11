/**
 * AN-164: pure, non-authorizing DESIGN assessments only.
 * The caller can lie about every fact. Both results are permanently BLOCKED.
 * These are NOT write plans, not approval proofs, and not authorization tokens.
 * A future trusted service must implement separate audited commands after approval.
 */
export const ANIME_SYNOPSIS_DESIGN_VERSION = 'AN-164-v1' as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_REVISION = 2147483646;

export type AnimeSynopsisProposalFacts = {
  subjectType: string;
  editorialCaseState: string;
  editorialCaseRevision: number;
  legacyChangeRequestId: string | null;
  candidateId: string | null;
  openerId: string | null;
  proposedPatch: unknown;
};

export type AnimeSynopsisApprovalFacts = AnimeSynopsisProposalFacts & {
  reviewerId: string | null;
  reviewerRole: string;
  reviewerDecision: string;
  reviewerNote: string | null;
  provenanceEvidenceVerified: boolean;
};

export type AnimeSynopsisCommitFacts = AnimeSynopsisProposalFacts & {
  canonicalAnimeId: string | null;
  actorId: string | null;
  actorRole: string;
  approvalReviewerId: string | null;
  approvalCaseRevision: number;
  approvalAuditPersisted: boolean;
  canonicalRecordExists: boolean;
  expectedCanonicalUpdatedAt: string | null;
  observedCanonicalUpdatedAt: string | null;
  provenanceEvidenceVerified: boolean;
};

export type BlockedSynopsisDecision = {
  policyVersion: typeof ANIME_SYNOPSIS_DESIGN_VERSION;
  status: 'BLOCKED';
  reasons: string[];
  canApprove: false;
  canWriteCanonical: false;
  canPublish: false;
};

function validRevision(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 1 && value <= MAX_REVISION;
}

function validSynopsisOnlyPatch(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (keys.length !== 1 || keys[0] !== 'synopsis' || typeof obj.synopsis !== 'string') return false;
  const content = obj.synopsis.trim();
  // Align with legacy proposal validation; no side effects or normalization here.
  // eslint-disable-next-line no-control-regex -- Unsafe control characters are deliberately rejected.
  return content.length >= 1 && content.length <= 10000 && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(content);
}

function reviewNoteValid(note: string | null): boolean {
  return typeof note === 'string' && note.trim().length >= 5 && note.trim().length <= 2000;
}

function commonProposalBlockers(facts: AnimeSynopsisProposalFacts): string[] {
  const reasons: string[] = [];
  if (facts?.subjectType !== 'ANIME') reasons.push('ANIME_ONLY');
  if (facts?.legacyChangeRequestId !== null) reasons.push('LEGACY_WORKFLOW_SEPARATE');
  if (!validRevision(facts?.editorialCaseRevision)) reasons.push('EDITORIAL_REVISION_INVALID');
  if (!facts?.candidateId || !UUID.test(facts.candidateId)) reasons.push('CANDIDATE_ID_INVALID');
  if (!facts?.openerId || !UUID.test(facts.openerId)) reasons.push('OPENER_ID_INVALID');
  if (!validSynopsisOnlyPatch(facts?.proposedPatch)) reasons.push('SYNOPSIS_ONLY_PATCH_REQUIRED');
  return reasons;
}

function blocked(reasons: string[]): BlockedSynopsisDecision {
  return {
    policyVersion: ANIME_SYNOPSIS_DESIGN_VERSION,
    status: 'BLOCKED',
    reasons,
    canApprove: false,
    canWriteCanonical: false,
    canPublish: false,
  };
}

/** Requirements for a FUTURE separate, durable editorial approval action. */
export function assessAnimeSynopsisApproval(facts: AnimeSynopsisApprovalFacts): BlockedSynopsisDecision {
  const reasons = ['APPROVAL_ACTION_NOT_IMPLEMENTED', 'REVIEW_FACTS_NOT_TRUSTED_DB_EVIDENCE', ...commonProposalBlockers(facts)];
  if (facts?.editorialCaseState !== 'UNDER_REVIEW') reasons.push('HUMAN_REVIEW_STATE_REQUIRED');
  if (facts?.reviewerRole !== 'ADMIN') reasons.push('REVIEWER_ADMIN_REQUIRED');
  if (!facts?.reviewerId || !UUID.test(facts.reviewerId)) reasons.push('REVIEWER_ID_INVALID');
  if (facts?.reviewerId && facts.reviewerId === facts.openerId) reasons.push('INDEPENDENT_REVIEWER_REQUIRED');
  if (facts?.reviewerDecision !== 'APPROVE') reasons.push('EXPLICIT_APPROVAL_DECISION_REQUIRED');
  if (!reviewNoteValid(facts?.reviewerNote)) reasons.push('HUMAN_REVIEW_NOTE_REQUIRED');
  if (facts?.provenanceEvidenceVerified !== true) reasons.push('PROVENANCE_UNVERIFIED');
  return blocked(reasons);
}

/**
 * Requirements for a FUTURE canonical writer. A valid-looking approval fact
 * is NOT proof of persisted review/audit. New code must reread persisted data,
 * enforce revision CAS, verify source rights, and write an immutable snapshot.
 * Mapping: proposal.synopsis -> Anime.description; all other fields untouched.
 */
export function assessAnimeSynopsisCanonicalCommit(facts: AnimeSynopsisCommitFacts): BlockedSynopsisDecision {
  const reasons = ['CANONICAL_COMMIT_NOT_IMPLEMENTED', 'APPROVAL_AND_CANONICAL_WRITES_REQUIRE_SEPARATE_AUDITED_COMMANDS', ...commonProposalBlockers(facts)];
  if (facts?.editorialCaseState !== 'APPROVED') reasons.push('PERSISTED_APPROVAL_REQUIRED');
  if (facts?.actorRole !== 'ADMIN' || !facts.actorId || !UUID.test(facts.actorId)) reasons.push('COMMITTER_AUTH_REQUIRED');
  if (!facts?.approvalReviewerId || !UUID.test(facts.approvalReviewerId) || facts.approvalReviewerId === facts.openerId) {
    reasons.push('INDEPENDENT_APPROVAL_REVIEWER_REQUIRED');
  }
  if (!validRevision(facts?.approvalCaseRevision) || facts.approvalCaseRevision !== facts.editorialCaseRevision) {
    reasons.push('APPROVAL_REVISION_MISMATCH');
  }
  if (facts?.approvalAuditPersisted !== true) reasons.push('DURABLE_APPROVAL_AUDIT_REQUIRED');
  if (facts?.provenanceEvidenceVerified !== true) reasons.push('PROVENANCE_UNVERIFIED');
  if (!facts?.canonicalAnimeId || !UUID.test(facts.canonicalAnimeId) || facts.canonicalRecordExists !== true) {
    reasons.push('EXISTING_CANONICAL_ANIME_REQUIRED');
  }
  if (!facts?.expectedCanonicalUpdatedAt || !facts?.observedCanonicalUpdatedAt ||
      !Number.isFinite(Date.parse(facts.expectedCanonicalUpdatedAt)) ||
      !Number.isFinite(Date.parse(facts.observedCanonicalUpdatedAt)) ||
      facts.expectedCanonicalUpdatedAt !== facts.observedCanonicalUpdatedAt) {
    reasons.push('CANONICAL_OPTIMISTIC_LOCK_NOT_VERIFIED');
  }
  // NOTE: Matching caller-supplied timestamps is NOT a real database CAS.
  // Separate publication and asset release remain forbidden without their gates.
  return blocked(reasons);
}
