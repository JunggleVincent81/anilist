/** AN-167: private publication/asset release REVIEW ONLY; never authorization. */
export const PRIVATE_PUBLICATION_READINESS_VERSION = 'AN-167-v1' as const;

export type PrivatePublicationFacts = {
  subjectType: string;
  caseState: string;
  caseHasImmutableApproval: boolean;
  canonicalCommitAudited: boolean;
  canonicalExists: boolean;
  candidateIsQuarantined: boolean | null;
  animeCatalogStatus: string | null;
  animeIsAdult: boolean | null;
  ageDecisionHumanVerified: boolean;
  sourceProvenanceVerified: boolean;
  licenseEvidencePresent: boolean;
  licenseReviewState: string | null;
  licenseExpiresAt: string | null;
  licenseRevokedAt: string | null;
};

export type PrivatePublicationResult = {
  policyVersion: typeof PRIVATE_PUBLICATION_READINESS_VERSION;
  status: 'BLOCKED';
  reasons: string[];
  canPublish: false;
  canReleaseAsset: false;
  canWriteCanonical: false;
};

export function assessPrivatePublicationReadiness(
  facts: PrivatePublicationFacts | null | undefined,
  now: Date = new Date(),
): PrivatePublicationResult {
  const reasons = ['PUBLICATION_AUTHORIZATION_SERVICE_NOT_IMPLEMENTED', 'ASSET_RELEASE_AUTHORIZATION_NOT_IMPLEMENTED'];
  if (!facts || facts.subjectType !== 'ANIME') reasons.push('DOMAIN_NOT_SUPPORTED');
  if (facts?.caseState !== 'APPROVED' || facts.caseHasImmutableApproval !== true) reasons.push('PERSISTED_EDITORIAL_APPROVAL_REQUIRED');
  if (facts?.canonicalCommitAudited !== true || facts?.canonicalExists !== true) reasons.push('CANONICAL_COMMIT_EVIDENCE_REQUIRED');
  if (facts?.candidateIsQuarantined !== false) reasons.push('CANDIDATE_QUARANTINED_OR_UNKNOWN');
  if (facts?.animeCatalogStatus !== 'INCLUDED' || facts?.animeIsAdult !== false || facts.ageDecisionHumanVerified !== true) {
    reasons.push('HUMAN_AGE_CLASSIFICATION_NOT_ELIGIBLE');
  }
  if (facts?.sourceProvenanceVerified !== true) reasons.push('SOURCE_PROVENANCE_UNVERIFIED');
  if (facts?.licenseEvidencePresent !== true || facts?.licenseReviewState !== 'VERIFIED') {
    reasons.push('MEDIA_LICENSE_UNVERIFIED');
  }
  if (facts?.licenseRevokedAt !== null) reasons.push('MEDIA_LICENSE_REVOKED_OR_UNKNOWN');
  const expiryMs = typeof facts?.licenseExpiresAt === 'string' && facts.licenseExpiresAt.trim()
    ? Date.parse(facts.licenseExpiresAt) : NaN;
  if (!Number.isFinite(expiryMs) || !Number.isFinite(now.getTime()) || expiryMs <= now.getTime()) {
    reasons.push('MEDIA_LICENSE_EXPIRED_OR_UNKNOWN');
  }
  // Inputs are untrusted; even all passing facts cannot authorize a public side effect.
  return {
    policyVersion: PRIVATE_PUBLICATION_READINESS_VERSION,
    status: 'BLOCKED', reasons, canPublish: false, canReleaseAsset: false, canWriteCanonical: false,
  };
}
