/**
 * AN-163B — internal, read-only publication boundary assessment.
 * This is NOT authorization, approval, a canonical writer, or a public endpoint.
 * Every decision stays BLOCKED until independent, approved write gates exist.
 */
export const EDITORIAL_PUBLICATION_POLICY_VERSION = 'AN-163B-v1' as const;

export type EditorialPublicationFacts = {
  subjectType: string;
  editorialCaseState: string;
  editorialCaseRevision: number;
  legacyChangeRequestId: string | null;
  candidateIsQuarantined: boolean | null;
  canonicalRecordExists: boolean;
  // Anime-only public eligibility; other domain policies are not implemented.
  animeCatalogStatus: string | null;
  animeIsAdult: boolean | null;
  ageEvidenceReadiness: string | null;
  originEvidenceReadiness: string | null;
  sourceProvenanceReviewed: boolean;
  mediaRightsApproved: boolean;
};

export type EditorialPublicationAssessment = {
  policyVersion: typeof EDITORIAL_PUBLICATION_POLICY_VERSION;
  canonicalCommit: { status: 'BLOCKED'; reasons: string[] };
  publicRelease: { status: 'BLOCKED'; reasons: string[] };
  // Literal false, not a boolean inferred from caller-provided flags.
  canWriteCanonical: false;
  canPublish: false;
  canReleaseAsset: false;
};

/**
 * The inputs are unverified observations, not grants of authority. Even an
 * apparently complete record must NEVER be treated as an authorization token.
 * Future implementations must reread DB facts and enforce separate human
 * approvals in a trusted transactional service before any side effect.
 */
export function assessEditorialPublicationBoundary(
  facts: EditorialPublicationFacts,
): EditorialPublicationAssessment {
  const canonical: string[] = ['CANONICAL_WRITE_GATE_NOT_IMPLEMENTED'];
  const publicRelease: string[] = ['PUBLICATION_GATE_NOT_IMPLEMENTED'];

  if (!facts || ![
    'ANIME', 'ANIME_EPISODE',
    'MANGA_WORK', 'MANGA_VOLUME', 'MANGA_CHAPTER',
    'MUSIC_TRACK', 'MUSIC_RECORDING', 'MUSIC_RELEASE', 'MUSIC_ARTIST',
  ].includes(facts.subjectType)) {
    canonical.push('SUBJECT_TYPE_UNSUPPORTED');
    publicRelease.push('SUBJECT_TYPE_UNSUPPORTED');
  }
  if (!Number.isSafeInteger(facts?.editorialCaseRevision) ||
      facts.editorialCaseRevision < 1 ||
      facts.editorialCaseRevision > 2147483646) {
    canonical.push('EDITORIAL_REVISION_INVALID');
  }
  if (facts?.legacyChangeRequestId !== null) {
    canonical.push('LEGACY_WORKFLOW_MUST_REMAIN_SEPARATE');
    publicRelease.push('LEGACY_WORKFLOW_MUST_REMAIN_SEPARATE');
  }
  // AN-161 currently has no APPROVE action. A claimed APPROVED state is not
  // trusted either; this module deliberately never endorses its provenance.
  if (facts?.editorialCaseState !== 'APPROVED') {
    canonical.push('EDITORIAL_APPROVAL_NOT_PRESENT');
  } else {
    canonical.push('EDITORIAL_APPROVAL_NOT_VERIFIED');
  }
  if (facts?.sourceProvenanceReviewed !== true) {
    canonical.push('SOURCE_PROVENANCE_REVIEW_PENDING');
  } else {
    canonical.push('SOURCE_PROVENANCE_REVIEW_NOT_INDEPENDENTLY_VERIFIED');
  }
  if (facts?.candidateIsQuarantined !== false) {
    publicRelease.push('CANDIDATE_NOT_RELEASED_FROM_QUARANTINE');
  }
  if (facts?.canonicalRecordExists !== true) {
    publicRelease.push('CANONICAL_RECORD_NOT_PRESENT');
  }
  if (facts?.subjectType === 'ANIME') {
    if (facts.animeCatalogStatus !== 'INCLUDED' || facts.animeIsAdult !== false) {
      publicRelease.push('ANIME_PUBLIC_ELIGIBILITY_NOT_MET');
    }
    // The existing AN-139C2 assessor can only say AWAITING_APPROVAL;
    // evidence completeness is NOT proof of approval or age classification.
    if (facts.ageEvidenceReadiness !== 'AWAITING_APPROVAL' ||
        facts.originEvidenceReadiness !== 'AWAITING_APPROVAL') {
      publicRelease.push('ELIGIBILITY_DOCUMENTATION_INCOMPLETE');
    }
    publicRelease.push('HUMAN_AGE_AND_ORIGIN_APPROVAL_UNVERIFIED');
  } else {
    publicRelease.push('DOMAIN_PUBLIC_ELIGIBILITY_POLICY_UNAVAILABLE');
  }
  if (facts?.mediaRightsApproved !== true) {
    publicRelease.push('MEDIA_RIGHTS_NOT_VERIFIED');
  } else {
    publicRelease.push('MEDIA_RIGHTS_APPROVAL_NOT_INDEPENDENTLY_VERIFIED');
  }

  return {
    policyVersion: EDITORIAL_PUBLICATION_POLICY_VERSION,
    canonicalCommit: { status: 'BLOCKED', reasons: canonical },
    publicRelease: { status: 'BLOCKED', reasons: publicRelease },
    canWriteCanonical: false,
    canPublish: false,
    canReleaseAsset: false,
  };
}
