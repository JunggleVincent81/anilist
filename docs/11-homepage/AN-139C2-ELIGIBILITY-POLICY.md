# AN-139C2 — Catalog Age & Origin Evidence Governance

**Status:** APPROVED POLICY DIRECTION; IMPLEMENTED AS NON-PUBLISHING DRAFT VALIDATOR.

**Baseline:** `86844a6` · **No schema, SQL writes, import, public display or age unlock.**

## Scope and principles

Anime scope remains *Japanese anime, Chinese donghua and Korean aeni*, including verifiable co-productions. Movies, TV, OVA, ONA and Specials are each reviewed on their own merits. `Anime.catalogStatus=INCLUDED` alone does not establish age suitability, origin or artwork rights. Age, production country and image permission are **independent** decisions.

**A valid evidence URL, an official-looking page, credit to a studio, broadcast time, language, genres, audience marketing or absence of warnings never automatically verifies a classification.** Source evidence must refer to the exact release/edition/season/cour. Do not import a rating from an earlier season, 1994 adaptation or another territory.

## Approved evidence tracks

1. **OFFICIAL_CLASSIFICATION**: name the actual classification authority or distributor/platform, **jurisdiction**, exact release/edition, classification symbol, scheme/version, original evidence URL, capture date, reviewer and review date. No global conversion table or inferred age threshold has been approved yet. A label from one jurisdiction cannot be automatically treated as an Indonesian content rating.
2. **EDITORIAL_REVIEW**: may be used when a release-specific official rating is unavailable. Record exact release/edition, explicit content observations and categories (violence, sexual content, nudity, etc.), direct traceable source(s), rationale and **two independent reviewers** with timestamps. Editorial judgement must be labeled editorial, never official. Reviewers may propose NON_ADULT/ADULT/UNRESOLVED but the proposal does not approve publication.

`AWAITING_APPROVAL` means a document's **required fields appear filled**, not that its factual claims, source authority, production identity, age outcome or public suitability have been independently verified. `INCOMPLETE` means required fields are absent/invalid. Both leave public eligibility **denied**.

## Separate country/production review

- Record all evidenced production-country codes (including co-productions), release identity, primary-production/committee role analysis, links, reviewer and date. Japanese studio headquarters or a Japanese TV channel alone cannot establish all countries.
- The software draft validator can flag incomplete origin evidence; it **does not validate historical production facts**. A supervisor must approve and reconcile countries against source claims before persistence. Records that are not verifiably JP/CN/KR-related remain pending regardless of age findings.
- Manga, anime music and poster licenses remain separate gates.

## Explicit security and decision boundaries

- The pure function `assessCatalogEligibilityEvidenceDraft()` checks document completeness only; it always returns `publicDisplayApproved:false`, `approvedIsAdult:null`, `approvedCountryCodes:[]`.
- No GraphQL resolver, UI editor, authorization, reviewer identity proof, DB schema, migration, backfill or publishing integration is created under AN-139C2. It does not change homepage age filters.
- Current 12 pilot titles remain **UNKNOWN**; no auto conversion of `isAdult=NULL` into `false`. No artwork is approved.
- The exact official-rating-to-eligibility mapping, editorial rubric thresholds, admin roles/signoff, dispute process, evidence retention, audit log, expiration/revocation and reversible schema updates require **future separate design and user approval**.
- Only after such approval: proposed review states `DRAFT → UNDER_REVIEW → APPROVED/REJECTED → REVOKED`; preserve manual overrides, implement atomic audited DB changes, dual-check exceptional cases, and run browser QA.

## Future editor/database project

A future admin catalog editor may curate licensed posters and manually written/authorized synopses alongside title metadata and age/origin evidence. Uploading a poster yourself does not establish copyright permission. **That UI and the database schema are out of scope here.**

## Verification

Run focused Jest against `src/anime-catalog/catalog-eligibility-evidence-policy.spec.ts`, full web/API tests, typecheck, lint and builds, and Prisma migration status. AN-139C2 is complete when its code and documentation checkpoint passes; **the 12 pilot records remain unapproved**.
