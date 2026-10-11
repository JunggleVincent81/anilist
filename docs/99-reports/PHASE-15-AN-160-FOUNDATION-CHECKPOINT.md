# Phase 15 — AN-160 Foundation Checkpoint

**Date:** 2026-10-11
**Phase:** 15 — Editorial Governance & Publication Engine
**Task:** AN-160 — Private Catalog Candidate & Generic Editorial Foundation
**Status:** LOCAL FOUNDATION VERIFIED; publication and database deployment NOT approved
**Baseline Git HEAD:** `e97c33976dca06bf6127176cd2f5fded3c3a1cef`

## Scope delivered

- Added private `CatalogCandidate` with typed editorial subject, private source and normalized JSON payloads, source provenance, optional creator, and `isQuarantined = true` default.
- Added `EditorialCase` generic editorial root with typed subject, draft/review state, positive revision, optional candidate, optional canonical UUID reference and optional legacy request link.
- Added `EditorialSubjectType` and `EditorialCaseState` enums.
- Added optional compatibility relation to existing `CatalogChangeRequest`, preserving its existing fields and synopsis editor/review workflow.
- Prepared one new additive migration `20261011120000_an160_editorial_staging_foundation` and contract tests.

## Local implementation paths

1. `apps/api/prisma/schema.prisma`
2. `apps/api/prisma/migrations/20261011120000_an160_editorial_staging_foundation/migration.sql`
3. `apps/api/src/admin-catalog/editorial-foundation-schema.spec.ts`

## Verification evidence

- Prisma schema validation: **PASS**.
- API TypeScript `tsc --noEmit`: **PASS**.
- API ESLint `--max-warnings=0`: **PASS**.
- Targeted API Jest suites (AN-160 plus legacy synopsis/curation): **4/4 PASS, 20/20 tests PASS** (rerun at checkpoint).
- Isolated PostgreSQL 18 rehearsal: **26/26 migrations PASS** (25 existing plus AN-160A), with isolated networking and no published host ports.
- New private schema: 2 tables, 4 restrictive foreign keys, revision-positive check and unique legacy change-request reference verified.
- Negative constraints: non-positive revision, missing legacy foreign key and deletion of referenced candidate rejected as intended.
- Transactional test fixtures rolled back; both new editorial tables returned zero records.
- Legacy `CatalogChangeRequest` column fingerprint preserved across the isolated AN-160A migration.
- Isolated rehearsal log: `anilist-AN160B-rehearsal-lEQzuoI1.txt` (stored locally in Downloads, not added to Git).
- Worktree SHA-256 fingerprint during AN-160B and before this checkpoint: `526b5d3db783b2e225ca03fee65169ad5d761520f1791898fc35017e8bd6339a`.

## Explicitly not implemented or authorized

- No GraphQL endpoint, admin UI, importer, data staging ingestion, canonical mutation or automatic publication.
- No automatic age or media-rights approval; private candidate payloads may not be exposed publicly.
- `EditorialCase.APPROVED` means an editorial workflow state, **not** permission to publish canonical data.
- No development or production migration, backfill, seed, external data download, deployment or database write was performed by this task.
- The 26/26 migration success is **isolated PostgreSQL evidence**, not evidence that development/production databases are migrated.
- Existing `apps/web/next-env.d.ts` and `apps/web/test-results/an146/.last-run.json` local changes are excluded and must remain untouched.

## Handoff

- AN-160 is a **foundational checkpoint only**. Generic validation, rights policy, candidate ingestion, reviewer authorization, transition handling, approval and canonical commit are deferred to separately approved follow-ups.
- Next proposed task: AN-161 — Editorial Workflow & Legacy Compatibility, beginning with scoped contract/permissions design. No automatic implementation or database rollout is authorized by this checkpoint.
