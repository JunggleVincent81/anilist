import { describe, expect, it } from '@jest/globals';
import {
  assessEditorialPublicationBoundary,
  type EditorialPublicationFacts,
} from './editorial-publication-gates.js';

const completeLooking: EditorialPublicationFacts = {
  subjectType: 'ANIME',
  editorialCaseState: 'APPROVED',
  editorialCaseRevision: 4,
  legacyChangeRequestId: null,
  candidateIsQuarantined: false,
  canonicalRecordExists: true,
  animeCatalogStatus: 'INCLUDED',
  animeIsAdult: false,
  ageEvidenceReadiness: 'AWAITING_APPROVAL',
  originEvidenceReadiness: 'AWAITING_APPROVAL',
  sourceProvenanceReviewed: true,
  mediaRightsApproved: true,
};

const assess = (changes: Partial<EditorialPublicationFacts> = {}) =>
  assessEditorialPublicationBoundary({ ...completeLooking, ...changes });

describe('AN-163B canonical commit vs public release: deny-by-default contract', () => {
  it('never grants canonical writes, public release, or asset release even when all claimed facts look complete', () => {
    const result = assess();
    expect(result.policyVersion).toBe('AN-163B-v1');
    expect(result.canonicalCommit.status).toBe('BLOCKED');
    expect(result.publicRelease.status).toBe('BLOCKED');
    expect(result.canWriteCanonical).toBe(false);
    expect(result.canPublish).toBe(false);
    expect(result.canReleaseAsset).toBe(false);
    expect(result.canonicalCommit.reasons).toContain('CANONICAL_WRITE_GATE_NOT_IMPLEMENTED');
    expect(result.publicRelease.reasons).toContain('PUBLICATION_GATE_NOT_IMPLEMENTED');
    expect(result.canonicalCommit.reasons).toContain('EDITORIAL_APPROVAL_NOT_VERIFIED');
    expect(result.canonicalCommit.reasons).toContain('SOURCE_PROVENANCE_REVIEW_NOT_INDEPENDENTLY_VERIFIED');
    expect(result.publicRelease.reasons).toContain('HUMAN_AGE_AND_ORIGIN_APPROVAL_UNVERIFIED');
  });

  it('treats an unapproved workflow state and incomplete provenance as canonical blockers', () => {
    const result = assess({ editorialCaseState: 'UNDER_REVIEW', sourceProvenanceReviewed: false });
    expect(result.canonicalCommit.reasons).toEqual(expect.arrayContaining([
      'EDITORIAL_APPROVAL_NOT_PRESENT', 'SOURCE_PROVENANCE_REVIEW_PENDING',
    ]));
  });

  it('keeps legacy synopsis requests outside the generic canonical/publication pipeline', () => {
    const result = assess({ legacyChangeRequestId: 'legacy-request-id' });
    expect(result.canonicalCommit.reasons).toContain('LEGACY_WORKFLOW_MUST_REMAIN_SEPARATE');
    expect(result.publicRelease.reasons).toContain('LEGACY_WORKFLOW_MUST_REMAIN_SEPARATE');
  });

  it('blocks quarantined candidates and nonexistent canonical records', () => {
    const result = assess({ candidateIsQuarantined: true, canonicalRecordExists: false });
    expect(result.publicRelease.reasons).toEqual(expect.arrayContaining([
      'CANDIDATE_NOT_RELEASED_FROM_QUARANTINE', 'CANONICAL_RECORD_NOT_PRESENT',
    ]));
  });

  it('never treats unknown/adult age, or REVIEW/EXCLUDED catalog status, as public eligible', () => {
    for (const changes of [
      { animeIsAdult: null }, { animeIsAdult: true },
      { animeCatalogStatus: 'REVIEW' }, { animeCatalogStatus: 'EXCLUDED' },
    ]) {
      expect(assess(changes).publicRelease.reasons).toContain('ANIME_PUBLIC_ELIGIBILITY_NOT_MET');
    }
  });

  it('keeps evidence completeness distinct from human approval and source rights', () => {
    const result = assess({
      ageEvidenceReadiness: 'INCOMPLETE',
      originEvidenceReadiness: 'INCOMPLETE',
      mediaRightsApproved: false,
    });
    expect(result.publicRelease.reasons).toEqual(expect.arrayContaining([
      'ELIGIBILITY_DOCUMENTATION_INCOMPLETE', 'HUMAN_AGE_AND_ORIGIN_APPROVAL_UNVERIFIED',
      'MEDIA_RIGHTS_NOT_VERIFIED',
    ]));
  });

  it('blocks every non-ANIME canonical domain until separate eligibility policies exist', () => {
    for (const subjectType of ['ANIME_EPISODE', 'MANGA_WORK', 'MANGA_VOLUME', 'MANGA_CHAPTER', 'MUSIC_TRACK', 'MUSIC_RECORDING', 'MUSIC_RELEASE', 'MUSIC_ARTIST']) {
      const result = assess({ subjectType });
      expect(result.publicRelease.reasons).toContain('DOMAIN_PUBLIC_ELIGIBILITY_POLICY_UNAVAILABLE');
      expect(result.publicRelease.reasons).not.toContain('SUBJECT_TYPE_UNSUPPORTED');
      expect(result.canPublish).toBe(false);
    }
  });

  it('rejects unsupported subjects and malformed revisions without a write path', () => {
    const result = assess({ subjectType: 'NOVEL', editorialCaseRevision: 2147483647 });
    expect(result.canonicalCommit.reasons).toEqual(expect.arrayContaining([
      'SUBJECT_TYPE_UNSUPPORTED', 'EDITORIAL_REVISION_INVALID',
    ]));
    expect(result.publicRelease.reasons).toContain('SUBJECT_TYPE_UNSUPPORTED');
  });

  it('treats missing quarantine/age facts as blockers', () => {
    const result = assess({ candidateIsQuarantined: null, animeIsAdult: null });
    expect(result.publicRelease.reasons).toContain('CANDIDATE_NOT_RELEASED_FROM_QUARANTINE');
    expect(result.publicRelease.reasons).toContain('ANIME_PUBLIC_ELIGIBILITY_NOT_MET');
  });

  it('never mutates the source facts', () => {
    const source = { ...completeLooking };
    const copy = { ...source };
    assessEditorialPublicationBoundary(source);
    expect(source).toEqual(copy);
  });
});
