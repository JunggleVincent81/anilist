# Phase 15 — AN-164 Inactive Anime Synopsis Approval & Canonical Commit Design

**Date:** 2026-10-11
**Baseline:** `4880ef27f41ca1d2a64f5fc2ec6db94a4ade9818` (AN-163)
**Scope:** pure non-authorizing contracts + unit tests; ANIME synopsis only
**Status:** implementation contract prepared; NOT an active approval or canonical writer

## Exact contract

- Approval and canonical commit are separate prospective commands with their own authenticated ADMIN actor, independent review, persistent reasons, optimistic case revision, audit and idempotency requirements.
- Draft input is a JSON object with exactly `synopsis` (1–10000 valid text characters). The targeted **canonical column is `Anime.description`**; the draft/legacy proposal key `synopsis` must never be interpreted as permission to edit `Anime.isAdult`, `catalogStatus`, `slug`, artwork, external IDs, or any other field.
- Candidate source/provenance, case owner/reviewer, audit chain and approval event must be reread from trusted persisted records at execution time. Caller-provided facts or assessment results are NOT authorization.
- Proposed canonical writer needs an existing canonical Anime UUID, equality guarded by persisted `Anime.updatedAt` (or separately designed stronger version), single-field update, immutable before/after revision evidence, and failure-atomic decision audit. A matching pair of caller-provided timestamps alone is NOT a DB compare-and-swap.
- The separate approval action is NOT implemented. Existing AN-161 policy intentionally refuses APPROVE. The generic private service remains unregistered.
- `CatalogChangeRequest` legacy synopsis drafts and review stay separate. No mutation/approval bridge, no backfill, and no duplicate canonical change path introduced.

## Gate decisions (still BLOCKED)

- **G1 reviewer approval:** independent ADMIN reviewer, human reason, verified source, authenticated decision and durable audit; no implementation yet.
- **G2 canonical commit:** separate actor/action, approved revision, single-field `description`, immutable snapshots, optimistic CAS, idempotency, transactional failure recovery; no implementation yet.
- **G3 public release:** independent authorization, age/origin/rights/eligibility and curated snapshot required. An approved/committed synopsis does not publish itself.
- **G4–G6:** age, origin, images/music and non-Anime eligibility are NOT granted by synopsis review.
- **G7 legacy synopsis:** existing `CatalogChangeRequest` behavior unchanged.
- **G8 runtime integration:** real Prisma E2E, reviewed auth and independent approved database rollout still outstanding.

## Delivery & verification boundary

1. `apps/api/src/admin-catalog/anime-synopsis-approval-commit-contract.ts`
2. `apps/api/src/admin-catalog/anime-synopsis-approval-commit-contract.spec.ts`
3. `docs/99-reports/PHASE-15-AN-164-SYNOPSIS-APPROVAL-COMMIT-DESIGN.md`

Test plan: focused AN-164 + existing editorial, eligibility and legacy Jest suites; API TypeScript and ESLint; schema marker, migration inventory, Git status and protected-file byte checks.

**NO migration**, new Prisma model, database access, import, production/development rollout, registration in NestJS, GraphQL endpoint, reviewer approval action, **NO canonical write**, publication, asset release or deployment. All decision results return `BLOCKED`, `canApprove: false`, `canWriteCanonical: false`, and `canPublish: false`. This milestone does not authorize implementation of a write path.
