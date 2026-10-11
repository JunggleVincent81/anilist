import { describe, expect, it } from '@jest/globals';
import { assessPrivatePublicationReadiness, type PrivatePublicationFacts } from './private-publication-readiness.js';

const goodLooking: PrivatePublicationFacts = {
  subjectType: 'ANIME', caseState: 'APPROVED', caseHasImmutableApproval: true,
  canonicalCommitAudited: true, canonicalExists: true,
  candidateIsQuarantined: false, animeCatalogStatus: 'INCLUDED', animeIsAdult: false,
  ageDecisionHumanVerified: true, sourceProvenanceVerified: true,
  licenseEvidencePresent: true, licenseReviewState: 'VERIFIED',
  licenseExpiresAt: '2030-01-01T00:00:00Z', licenseRevokedAt: null,
};
const now = new Date('2026-10-11T00:00:00Z');
const assess = (x: Partial<PrivatePublicationFacts> = {}) => assessPrivatePublicationReadiness({ ...goodLooking, ...x }, now);

describe('AN-167 review-only publication and asset release readiness', () => {
  it('always denies public release, asset release and writer authority even when all claims look good', () => {
    expect(assess()).toMatchObject({ policyVersion: 'AN-167-v1', status: 'BLOCKED',
      canPublish: false, canReleaseAsset: false, canWriteCanonical: false });
    expect(assess().reasons).toContain('PUBLICATION_AUTHORIZATION_SERVICE_NOT_IMPLEMENTED');
  });
  it('rejects non-Anime domains and missing canonical audit', () => {
    expect(assess({ subjectType: 'MANGA_WORK' }).reasons).toContain('DOMAIN_NOT_SUPPORTED');
    expect(assess({ canonicalCommitAudited: false }).reasons).toContain('CANONICAL_COMMIT_EVIDENCE_REQUIRED');
  });
  it('denies unknown/adult age, missing human age approval and excluded catalog', () => {
    for (const x of [ { animeIsAdult: null }, { animeIsAdult: true },
      { animeCatalogStatus: 'REVIEW' }, { ageDecisionHumanVerified: false } ]) {
      expect(assess(x).reasons).toContain('HUMAN_AGE_CLASSIFICATION_NOT_ELIGIBLE');
    }
  });
  it('blocks candidate quarantine and unknown origin', () => {
    expect(assess({ candidateIsQuarantined: true }).reasons).toContain('CANDIDATE_QUARANTINED_OR_UNKNOWN');
    expect(assess({ candidateIsQuarantined: null }).reasons).toContain('CANDIDATE_QUARANTINED_OR_UNKNOWN');
    expect(assess({ sourceProvenanceVerified: false }).reasons).toContain('SOURCE_PROVENANCE_UNVERIFIED');
  });
  it('blocks invalid, expired, missing and revoked licensing', () => {
    for (const x of [ { licenseExpiresAt: null }, { licenseExpiresAt: '2020-01-01' },
      { licenseExpiresAt: 'invalid' } ]) {
      expect(assess(x).reasons).toContain('MEDIA_LICENSE_EXPIRED_OR_UNKNOWN');
    }
    expect(assess({ licenseRevokedAt: '2026-10-11T00:00:00Z' }).reasons).toContain('MEDIA_LICENSE_REVOKED_OR_UNKNOWN');
    expect(assess({ licenseReviewState: 'PENDING' }).reasons).toContain('MEDIA_LICENSE_UNVERIFIED');
    expect(assess({ licenseEvidencePresent: false }).reasons).toContain('MEDIA_LICENSE_UNVERIFIED');
  });
  it('does not mutate its input object', () => {
    const input = { ...goodLooking };
    assessPrivatePublicationReadiness(input, now);
    expect(input).toEqual(goodLooking);
  });
});
