# Catalog Eligibility, Manga/Music and Image Evidence

Historical staged gates are retained; latest runtime established public manga/music queries and pages with empty curated tables. Neither image URL validity nor catalog inclusion alone authorizes display.

> Consolidated technical reference. Earlier milestone status lines are historical; current status is specified in the phase completion report.


---

## 136 Completion Gates

*Historical source: `AN-136-COMPLETION-GATES.md`.*

This patch provides `/manga` and `/music` server-rendered catalogue previews, data-source attributions, graceful empty/loading/error states, typed GraphQL client queries and frontend contract tests. It does **not** contain invented catalogue records, a publication workflow, or audio streaming. Navigation remains deliberately disabled until a real reviewed catalogue is published.

## Pending mandatory gates

1. **Database**: isolated migration replay against a disposable PostgreSQL database matching the target, SQL diff and schema verification, then **separate user approval** before modifying active DB. Do not run `migrate deploy`, `migrate dev`, `db push` or backfill without approval.
2. **Content**: supply real source-attributed manga and music records; verify rights and attribution, classification (adult unknown must remain hidden), identity uniqueness and human publication approval. No invented seed.
3. **Runtime**: after approved DB activation, test GraphQL `publicMangaPreview` and `publicAnimeMusicPreview` on actual API port (normally 4000). Verify `/manga` and `/music` on Next.js port 3000 in empty state and after approved publication. Build alone is not live acceptance.
4. **Security**: verify no mutation or admin route allows unpublished rows to appear; add authentication, editorial review, moderation, and audit trail before opening public editing or automatic publication.
5. **Phase 11 homepage**: do not enable Manga/Music primary nav until adequate reviewed data exists. Current frontend pages are accessible by their URLs, but not advertised as active primary modules.

Status: **Frontend prepared — acceptance conditional on operational gates above.**


---

## 136 Manga Music Data Gate

*Historical source: `AN-136-MANGA-MUSIC-DATA-GATE.md`.*

**Decision: DEFERRED — no preview implemented.**

Phase 11 permits Manga and Anime Music previews **only when actual first-party catalog and API data exist**. Previous local read-only schema audits reported no dedicated Manga, Music, Theme or Artist tables. The existing Anime `MUSIC` enum value and `sourceMaterial = MANGA` do not provide opening/ending/OST catalog data or a separate manga database.

- No fabricated preview cards, sample counts, external images, routes, ratings or playback actions.
- Keep desktop Manga and Music future-category labels disabled per AN-130.
- Reassess only after dedicated domain model, data provenance, permissions, API and frontend routes are implemented and user-approved in later work.
- No schema, import, data or user-facing functionality changed by the AN-136 gate.

This is an explicit **deferral**, not feature completion. AN-134 catalog ranking remains blocked separately.


---

## 136 Manga Music Foundation Preparation

*Historical source: `AN-136-MANGA-MUSIC-FOUNDATION-PREPARATION.md`.*

Status: **CODE PREPARED — MIGRATION NOT APPLIED — PUBLIC FEATURE NOT ACCEPTED**.

- Independent `MangaWork` and `AnimeMusicTrack` models, not Anime.sourceMaterial or Anime.format aliases.
- Strict public selection: manga published AND isAdult=false; linked music requires eligible Anime (`isAdult=false`, `INCLUDED`).
- All records default unpublished; no automatic import, seed, assets, audio, streaming or invented catalogue content.
- Source name/reference are required for future manual curation. `isPublished` must only be set after separate content/provenance approval.
- Two read-only GraphQL queries, each capped at twenty records.
- **Before database deployment:** independent migration SQL review, backup, isolated DB rehearsal, rollback rehearsal, explicit user approval. No migration is run by the package.
- **Still required for AN-136 completion:** curate real eligible records, approve publication gate, add/activate manga/music UI and navigation after data availability, authenticated and public runtime smoke tests, browser accessibility, remote CI.


---

## 139B2 Safe Image Metadata Foundation

*Historical source: `AN-139B2-SAFE-IMAGE-METADATA-FOUNDATION.md`.*

Status: user-approved implementation; **not an artwork usage authorization**.

## Scope

- The offline import normalizer now recognizes `picture` and `thumbnail` as **candidate source metadata** in `NormalizedAnimeRecord.imageCandidates`.
- Each accepted candidate records `sourceDataset`, `sourceField`, `sourceHost`, and `sourceUrl`, together with immutable-at-normalization conservative values: `rightsStatus: UNVERIFIED`, `displayApproved: false`, `ageApproved: false`.
- HTTPS-only syntax; exact known dataset hostnames; no credentials/non-standard port/fragments; bounded URL length; known placeholder paths rejected. Sensitive-category path words are `riskHints` **only**, not age classifications.
- Known dataset hosts represent recognition of existing sources, **not permission for hotlinking, caching, proxying, or mirroring**.
- No external image HTTP requests, no migration, no image download, no database backfill, no `coverImageUrl` write, no public GraphQL fields or homepage changes.
- Existing `AnimeImportService` explicitly remains outside this change and does not consume or persist `imageCandidates`. Re-running imports is NOT part of AN-139B2.

## Boundary & follow-up

The candidate list is transient normalized source metadata; it is **not persisted** and thus does not itself create a curated asset database. Future persistence should have explicit source/rights evidence, user approval, revocation, and display-mode guards. Studio/distributor licensed art or manually curated, verified assets are alternatives to unlicensed syndicated posters.

AN-139B3 requires a separate copyright and hotlink gate plus scoped user approval. AN-139C requires age/origin evidence. Do not assign `isAdult=false` from URLs or URLs from age policy. The homepage may legitimately remain empty until those gates are resolved.

The proposed future first-party catalog authoring/editor workflow for manually supplied anime posters and synopses is **out of scope**, including any user submissions, upload infrastructure, or CMS.


---

## 139C2 Eligibility Policy

*Historical source: `AN-139C2-ELIGIBILITY-POLICY.md`.*

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
