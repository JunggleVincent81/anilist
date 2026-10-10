# Phase 13 — Audit & Design Evidence Appendix

## Evidence Status

Historical read-only inspection and reported terminal results.
No source files, migrations or database records were modified
as part of Phase 13.

## AN-148 — Repository Baseline

- Baseline branch: main.
- Baseline HEAD: d87d3e9.
- Existing Prisma migration files: 20.
- Development database: anime_platform.
- Working tree contained unrelated, uncommitted documentation
  refactoring and apps/web/next-env.d.ts changes.
- Those unrelated changes were not modified by the audits.

## AN-149 — Physical Schema Inspection

Existing structures reviewed:

- Anime, AnimeTitle, ExternalAnimeId and AnimeRelation.
- AnimeListEntry and AnimeReview.
- MangaWork and AnimeMusicTrack.
- CatalogChangeRequest, CatalogEvidence,
  CatalogReviewDecision, CatalogAsset, CatalogRevision,
  and CatalogProductionCountry.

Key compatibility finding:

CatalogChangeRequest requires an existing animeId.
A separate candidate-capable editorial root is required for
new canonical entries and additional domains.

## AN-150 — Data Integrity Sampling

Read-only PostgreSQL queries were executed against the
verified anime_platform database.

Observed aggregate results:

| Measurement | Result |
|---|---:|
| Total Anime | 38288 |
| INCLUDED Anime | 31270 |
| INCLUDED / isAdult TRUE | 0 |
| INCLUDED / isAdult NULL | 31270 |
| Total AnimeReview | 1 |
| Reviews not satisfying age-safe filter | 1 |
| Spoiler-flagged reviews | 1 |
| Reviews without current tracking entry | 1 |
| Review/tracking pairs with both scores | 0 |
| Review/tracking pairs with differing scores | 0 |

The SQL transaction was explicitly read-only and completed.

Interpretation boundaries:

- Unknown age does not prove adult content.
- A review without a current tracking entry does not prove
  the user never watched the Anime.
- Zero comparable scores does not establish score equality.
- Inconsistent code-level public filters indicate a potential
  visibility risk, not a proven disclosure incident.

## AN-151 — Migration & Recovery Evidence

Repository migration inventory:

- 20 migration.sql files observed.
- Existing additive catalog and Manga/Music foundations found.
- Existing PostgreSQL startup/shutdown scripts found.

Historical AN-146 report recorded:

- PostgreSQL 16 isolated migrations: 20/20 PASS.
- Isolated test database: an146_security_test.
- Browser E2E: 5/5 PASS.
- API authorization regression: 17/17 PASS.

The historical results do not establish a successful
backup/restore rehearsal for upcoming migrations.

Outstanding:

- Verified development database backup.
- Successful isolated restore rehearsal.
- Recovery timing and integrity evidence.
- New migration rehearsal and explicit approval.

## AN-152 — Physical Compatibility Inspection

Existing legacy editorial dependencies confirmed:

- AdminSynopsisDraftService uses CatalogChangeRequest.
- AdminSynopsisReviewService uses CatalogChangeRequest
  and CatalogReviewDecision.
- CatalogAsset and CatalogRevision reference existing Anime
  and legacy editorial change requests.

Design decisions:

- Preserve legacy editorial models and workflow.
- Introduce generic editorial root with compatibility layer.
- Preserve independent reviewer and draft-revision semantics.
- Separate approval, canonical commit and publication.
- Protect evidence, rights and cross-domain FK integrity.

## Approved Blueprint v1.0

Approved architecture principles: D-01 through D-10.

Physical domain candidates include:

- AnimeEpisode.
- MangaVolume and MangaChapter.
- MusicArtist, MusicRecording, MusicRelease,
  MusicReleaseTrack and MusicCredit.
- AnimeMangaRelation and AnimeMusicUsage.
- CatalogCandidate and generic editorial case models.
- Import staging models for a later phase.
- AnimeReview revision and publication snapshot support.

Model names and conceptual relationships are design candidates.
Exact Prisma fields, SQL constraints, new migrations and
implementation scope remain subject to later approval.

## Phase 13 Closure

User-approved status:
PLANNING / AUDIT COMPLETE — DESIGN BASELINE LOCKED.

No implementation or database modification authorized.

Phase 14 begins with read-only readiness and scoped
implementation planning.
