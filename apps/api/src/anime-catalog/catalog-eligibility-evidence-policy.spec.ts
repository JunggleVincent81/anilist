import {
  assessCatalogEligibilityEvidenceDraft,
} from './catalog-eligibility-evidence-policy.js';
import type {
  CatalogEligibilityEvidenceDraft,
  EditorialAgeEvidenceDraft,
  OfficialAgeEvidenceDraft,
  ProductionOriginEvidenceDraft,
} from './catalog-eligibility-evidence-policy.js';

const official: OfficialAgeEvidenceDraft = {
  track: 'OFFICIAL_CLASSIFICATION',
  proposedOutcome: 'NON_ADULT',
  releaseLabel: 'Season 2 / 2026 TV broadcast',
  authority: 'Example jurisdictional ratings authority',
  jurisdiction: 'JP',
  classification: 'Example classification (not real evidence)',
  schemeVersion: 'Example version',
  source: {
    url: 'https://example.org/season-2/rating',
    publisher: 'Example ratings authority',
    capturedOn: '2026-10-09',
    exactRelease: true,
  },
  reviewerId: 'reviewer-a',
  reviewedOn: '2026-10-09',
};

const editorial: EditorialAgeEvidenceDraft = {
  track: 'EDITORIAL_REVIEW',
  proposedOutcome: 'NON_ADULT',
  releaseLabel: 'Season 2 / 2026 TV broadcast',
  contentObservations: 'Example notes on violence, nudity and other content for this release.',
  contentCategories: ['VIOLENCE', 'SEXUAL_CONTENT'],
  sources: [official.source],
  primaryReviewerId: 'reviewer-a',
  primaryReviewedOn: '2026-10-09',
  secondaryReviewerId: 'reviewer-b',
  secondaryReviewedOn: '2026-10-09',
};

const origin: ProductionOriginEvidenceDraft = {
  releaseLabel: 'Season 2 / 2026 TV broadcast',
  proposedCountryCodes: ['JP', 'KR'],
  productionRoleEvidence: 'Example documented production committee/country-credit review.',
  sources: [official.source],
  reviewerId: 'origin-reviewer',
  reviewedOn: '2026-10-09',
};

function draft(
  age: CatalogEligibilityEvidenceDraft['age'] = official,
  originDraft: CatalogEligibilityEvidenceDraft['origin'] = origin,
): CatalogEligibilityEvidenceDraft {
  return {
    animeId: 'example-uuid-not-a-real-record',
    releaseLabel: 'Season 2 / 2026 TV broadcast',
    age,
    origin: originDraft,
  };
}

describe('AN-139C2 evidence policy draft completeness (NEVER approval)', () => {
  it('official rating evidence is only awaiting manual approval', () => {
    const result = assessCatalogEligibilityEvidenceDraft(draft());
    expect(result.ageReadiness).toBe('AWAITING_APPROVAL');
    expect(result.originReadiness).toBe('AWAITING_APPROVAL');
    expect(result.publicDisplayApproved).toBe(false);
    expect(result.approvedIsAdult).toBeNull();
    expect(result.approvedCountryCodes).toEqual([]);
  });

  it('editorial evidence requires independent reviewers but never unlocks age gate', () => {
    const result = assessCatalogEligibilityEvidenceDraft(draft(editorial));
    expect(result.ageReadiness).toBe('AWAITING_APPROVAL');
    expect(result.approvedIsAdult).toBeNull();
  });

  it('rejects same primary/secondary editorial reviewer', () => {
    const result = assessCatalogEligibilityEvidenceDraft(draft({
      ...editorial,
      secondaryReviewerId: 'reviewer-a',
    }));
    expect(result.ageIssues).toContain('EDITORIAL_INDEPENDENT_REVIEW_MISSING');
  });

  it('rejects missing editorial observations and content descriptors', () => {
    const result = assessCatalogEligibilityEvidenceDraft(draft({
      ...editorial, contentObservations: ' ', contentCategories: [],
    }));
    expect(result.ageIssues).toContain('EDITORIAL_CONTENT_ANALYSIS_MISSING');
  });

  it('rejects incomplete official rating authority, jurisdiction and scheme', () => {
    const result = assessCatalogEligibilityEvidenceDraft(draft({
      ...official, jurisdiction: '', schemeVersion: '',
    }));
    expect(result.ageIssues).toContain('OFFICIAL_AUTHORITY_OR_RATING_DETAILS_MISSING');
  });

  it('rejects missing release-specific evidence even when a domain is official', () => {
    const result = assessCatalogEligibilityEvidenceDraft(draft({
      ...official, source: { ...official.source, exactRelease: false },
    }));
    expect(result.ageIssues).toContain('OFFICIAL_RELEASE_SOURCE_MISSING');
  });

  it('rejects local, non-HTTPS and credentialled evidence URLs', () => {
    for (const url of [
      'http://example.org/rating',
      'https://localhost/rating',
      'https://127.0.0.1/rating',
      'https://a:password@example.org/rating',
    ]) {
      expect(assessCatalogEligibilityEvidenceDraft(draft({
        ...official, source: { ...official.source, url },
      })).ageReadiness).toBe('INCOMPLETE');
    }
  });

  it('rejects invalid capture date and review dates', () => {
    const result = assessCatalogEligibilityEvidenceDraft(draft({
      ...official, reviewedOn: '2026-02-30',
      source: { ...official.source, capturedOn: '2026-02-30' },
    }));
    expect(result.ageIssues).toEqual(expect.arrayContaining([
      'OFFICIAL_RELEASE_SOURCE_MISSING', 'OFFICIAL_REVIEWER_MISSING',
    ]));
  });

  it('does not use earlier-season ratings for another release', () => {
    const result = assessCatalogEligibilityEvidenceDraft(draft({
      ...official, releaseLabel: 'Season 1 / 2024',
    }));
    expect(result.ageIssues).toContain('AGE_RELEASE_IDENTITY_UNCONFIRMED');
  });

  it('does not approve unresolved age outcomes', () => {
    const result = assessCatalogEligibilityEvidenceDraft(draft({
      ...editorial, proposedOutcome: 'UNRESOLVED',
    }));
    expect(result.ageIssues).toContain('AGE_OUTCOME_UNRESOLVED');
  });

  it('age and origin evidence are independent', () => {
    const result = assessCatalogEligibilityEvidenceDraft(draft(official, null));
    expect(result.ageReadiness).toBe('AWAITING_APPROVAL');
    expect(result.originReadiness).toBe('INCOMPLETE');
    expect(result.publicDisplayApproved).toBe(false);
  });

  it('requires a JP, CN, or KR production link, with coproductions possible', () => {
    const result = assessCatalogEligibilityEvidenceDraft(draft(null, {
      ...origin, proposedCountryCodes: ['US'],
    }));
    expect(result.originIssues).toContain('ORIGIN_COUNTRY_SCOPE_UNRESOLVED');
    expect(result.ageReadiness).toBe('INCOMPLETE');
  });

  it('rejects duplicated country codes and absent production-role evidence', () => {
    const result = assessCatalogEligibilityEvidenceDraft(draft(official, {
      ...origin, proposedCountryCodes: ['JP', 'JP'], productionRoleEvidence: '',
    }));
    expect(result.originIssues).toEqual(expect.arrayContaining([
      'ORIGIN_COUNTRY_SCOPE_UNRESOLVED', 'ORIGIN_PRODUCTION_EVIDENCE_MISSING',
    ]));
  });

  it('does not mistake official production credits for verified origin', () => {
    const result = assessCatalogEligibilityEvidenceDraft(draft(official, {
      ...origin, sources: [{ ...official.source, exactRelease: false }],
    }));
    expect(result.originIssues).toContain('ORIGIN_PRODUCTION_EVIDENCE_MISSING');
  });

  it('never grants public age, origin or image access even for an adult outcome', () => {
    const result = assessCatalogEligibilityEvidenceDraft(draft({
      ...official, proposedOutcome: 'ADULT',
    }));
    expect(result.ageReadiness).toBe('AWAITING_APPROVAL');
    expect(result.publicDisplayApproved).toBe(false);
    expect(result.approvedIsAdult).toBeNull();
    expect(result.approvedCountryCodes).toEqual([]);
  });
});
