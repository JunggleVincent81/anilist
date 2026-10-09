/**
 * AN-139C2: evaluate DOCUMENT COMPLETENESS only.
 * This module has no database/API integration and never grants publication.
 * Human assertions and source URLs are not independently verified here.
 */
export const ELIGIBILITY_EVIDENCE_POLICY_VERSION = 1;

export type ProposedAgeAssessment = 'NON_ADULT' | 'ADULT' | 'UNRESOLVED';
export type EvidenceReviewTrack = 'OFFICIAL_CLASSIFICATION' | 'EDITORIAL_REVIEW';
export type EvidenceReadiness = 'INCOMPLETE' | 'AWAITING_APPROVAL';

export type EligibilityEvidenceReference = {
  url: string;
  publisher: string;
  capturedOn: string; // YYYY-MM-DD
  exactRelease: boolean; // REVIEWER CLAIM; not machine verification
};

export type OfficialAgeEvidenceDraft = {
  track: 'OFFICIAL_CLASSIFICATION';
  proposedOutcome: ProposedAgeAssessment;
  releaseLabel: string;
  authority: string;
  jurisdiction: string;
  classification: string;
  schemeVersion: string;
  source: EligibilityEvidenceReference;
  reviewerId: string;
  reviewedOn: string;
};

export type EditorialAgeEvidenceDraft = {
  track: 'EDITORIAL_REVIEW';
  proposedOutcome: ProposedAgeAssessment;
  releaseLabel: string;
  contentObservations: string;
  contentCategories: string[];
  sources: EligibilityEvidenceReference[];
  primaryReviewerId: string;
  primaryReviewedOn: string;
  secondaryReviewerId: string;
  secondaryReviewedOn: string;
};

export type AgeEvidenceDraft =
  | OfficialAgeEvidenceDraft
  | EditorialAgeEvidenceDraft;

export type ProductionOriginEvidenceDraft = {
  releaseLabel: string;
  proposedCountryCodes: string[]; // ISO 3166-1 alpha-2, incl. coproductions
  productionRoleEvidence: string;
  sources: EligibilityEvidenceReference[];
  reviewerId: string;
  reviewedOn: string;
};

export type CatalogEligibilityEvidenceDraft = {
  animeId: string;
  releaseLabel: string; // season, cour, movie edition, remake etc.
  age: AgeEvidenceDraft | null;
  origin: ProductionOriginEvidenceDraft | null;
};

export type CatalogEligibilityEvidenceAssessment = {
  policyVersion: 1;
  ageReadiness: EvidenceReadiness;
  originReadiness: EvidenceReadiness;
  ageIssues: string[];
  originIssues: string[];
  // These values are deliberately constant: no authorization here.
  publicDisplayApproved: false;
  approvedIsAdult: null;
  approvedCountryCodes: [];
};

function hasText(value: unknown, max = 2000): boolean {
  return typeof value === 'string' &&
    value.trim().length > 0 && value.length <= max;
}

function isDate(value: unknown): boolean {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isSourceReference(value: EligibilityEvidenceReference): boolean {
  if (!value || !hasText(value.publisher, 200) || !isDate(value.capturedOn) ||
    value.exactRelease !== true || typeof value.url !== 'string' ||
    value.url.length > 2048 || /\s|\\/.test(value.url) ||
    !value.url.startsWith('https://')) {
    return false;
  }
  try {
    const parsed = new URL(value.url);
    const hostname = parsed.hostname.toLowerCase();
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password ||
      parsed.port || parsed.hash || hostname === 'localhost' ||
      hostname.endsWith('.localhost') || hostname.endsWith('.local') ||
      hostname === '127.0.0.1' || hostname === '::1' ||
      hostname.startsWith('10.') || hostname.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function validSources(sources: EligibilityEvidenceReference[]): boolean {
  return Array.isArray(sources) && sources.length > 0 &&
    sources.length <= 20 && sources.every(isSourceReference);
}

function checkAgeDraft(draft: CatalogEligibilityEvidenceDraft): string[] {
  const issues: string[] = [];
  const age = draft.age;
  if (!age) return ['AGE_EVIDENCE_MISSING'];
  if (age.releaseLabel !== draft.releaseLabel || !hasText(age.releaseLabel, 250)) {
    issues.push('AGE_RELEASE_IDENTITY_UNCONFIRMED');
  }
  if (age.proposedOutcome === 'UNRESOLVED') {
    issues.push('AGE_OUTCOME_UNRESOLVED');
  }
  if (age.proposedOutcome !== 'ADULT' &&
    age.proposedOutcome !== 'NON_ADULT' &&
    age.proposedOutcome !== 'UNRESOLVED') {
    issues.push('AGE_OUTCOME_INVALID');
  }
  if (age.track === 'OFFICIAL_CLASSIFICATION') {
    if (!hasText(age.authority, 200) || !hasText(age.jurisdiction, 80) ||
      !hasText(age.classification, 100) || !hasText(age.schemeVersion, 100)) {
      issues.push('OFFICIAL_AUTHORITY_OR_RATING_DETAILS_MISSING');
    }
    if (!isSourceReference(age.source)) {
      issues.push('OFFICIAL_RELEASE_SOURCE_MISSING');
    }
    if (!hasText(age.reviewerId, 150) || !isDate(age.reviewedOn)) {
      issues.push('OFFICIAL_REVIEWER_MISSING');
    }
  } else if (age.track === 'EDITORIAL_REVIEW') {
    if (!hasText(age.contentObservations, 4000) ||
      !Array.isArray(age.contentCategories) ||
      age.contentCategories.length === 0 ||
      !age.contentCategories.every((item) => hasText(item, 80))) {
      issues.push('EDITORIAL_CONTENT_ANALYSIS_MISSING');
    }
    if (!validSources(age.sources)) {
      issues.push('EDITORIAL_RELEASE_SOURCE_MISSING');
    }
    if (!hasText(age.primaryReviewerId, 150) ||
      !hasText(age.secondaryReviewerId, 150) ||
      age.primaryReviewerId.trim() === age.secondaryReviewerId.trim() ||
      !isDate(age.primaryReviewedOn) || !isDate(age.secondaryReviewedOn)) {
      issues.push('EDITORIAL_INDEPENDENT_REVIEW_MISSING');
    }
  } else {
    issues.push('AGE_REVIEW_TRACK_INVALID');
  }
  return issues;
}

function checkOriginDraft(draft: CatalogEligibilityEvidenceDraft): string[] {
  const origin = draft.origin;
  if (!origin) return ['ORIGIN_EVIDENCE_MISSING'];
  const issues: string[] = [];
  if (origin.releaseLabel !== draft.releaseLabel ||
    !hasText(origin.releaseLabel, 250)) {
    issues.push('ORIGIN_RELEASE_IDENTITY_UNCONFIRMED');
  }
  const countries = origin.proposedCountryCodes;
  if (!Array.isArray(countries) || countries.length === 0 ||
    countries.length > 10 || !countries.every((code) => /^[A-Z]{2}$/.test(code)) ||
    new Set(countries).size !== countries.length ||
    !countries.some((code) => ['JP', 'CN', 'KR'].includes(code))) {
    issues.push('ORIGIN_COUNTRY_SCOPE_UNRESOLVED');
  }
  if (!hasText(origin.productionRoleEvidence, 4000) ||
    !validSources(origin.sources)) {
    issues.push('ORIGIN_PRODUCTION_EVIDENCE_MISSING');
  }
  if (!hasText(origin.reviewerId, 150) || !isDate(origin.reviewedOn)) {
    issues.push('ORIGIN_REVIEWER_MISSING');
  }
  return issues;
}

export function assessCatalogEligibilityEvidenceDraft(
  draft: CatalogEligibilityEvidenceDraft,
): CatalogEligibilityEvidenceAssessment {
  const identityIssues = !hasText(draft.animeId, 100) ||
    !hasText(draft.releaseLabel, 250) ? ['RELEASE_IDENTITY_MISSING'] : [];
  const ageIssues = [...identityIssues, ...checkAgeDraft(draft)];
  const originIssues = [...identityIssues, ...checkOriginDraft(draft)];
  return {
    policyVersion: 1,
    ageReadiness: ageIssues.length === 0 ? 'AWAITING_APPROVAL' : 'INCOMPLETE',
    originReadiness: originIssues.length === 0 ? 'AWAITING_APPROVAL' : 'INCOMPLETE',
    ageIssues,
    originIssues,
    publicDisplayApproved: false,
    approvedIsAdult: null,
    approvedCountryCodes: [],
  };
}
