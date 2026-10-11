# Phase 15 — AN-163 Publication Boundary Policy Checkpoint

**Date:** 2026-10-11
**Task:** AN-163A–D — Controlled Canonical Commit & Publication Gates (policy-only scope)
**Status:** AN-163 policy/review checkpoint; canonical commit and public release NOT implemented or approved
**Baseline:** `6c3ef0e7cf814471abd6cb1815a419e4183360fa` (AN-162)

## Delivered scope

- AN-163A: read-only evidence audit of editorial workflow, admin authorization, canonical/public eligibility, provenance, age, asset licensing and 27 repo migration files.
- AN-163B: pure `assessEditorialPublicationBoundary` policy with versioned, deny-by-default canonical/public/asset assessment; all three permission fields remain literal `false` even for apparently complete candidate data. Test suite checks nine editorial subjects, legacy isolation and unverified human assertions.
- AN-163C: read-only contract review and eight blocking decision gates, with zero source writes.
- AN-163D: checkpoint verification and scoped documentation; no new service or schema migration.

## Checkpoint paths

1. `apps/api/src/admin-catalog/editorial-publication-gates.ts`
2. `apps/api/src/admin-catalog/editorial-publication-gates.spec.ts`
3. This report.

## Decision record — ALL BLOCKED

- **G1 Editorial decision:** independent human `APPROVE` action and durable audit/authorization not implemented. AN-161 workflow expressly rejects approval.
- **G2 Canonical commit:** no approved subject/field allowlist, target UUID preservation strategy, canonical optimistic concurrency or atomic revision/snapshot write path.
- **G3 Public release:** editorial approval does not authorize publishing; an independent release action, evidence and curated snapshot checks are needed.
- **G4 Adult/origin evidence:** unknown age must fail closed; existing evidence assessor cannot independently verify source authenticity or final human approval.
- **G5 Image/music assets:** licensing, origin, allowed scope, expiry and release need separate evidence and human authorization; no URL-based inference.
- **G6 Non-Anime eligibility:** episode, manga and music must have explicitly defined rules; Anime eligibility is not implicitly transferable.
- **G7 Legacy synopsis:** `CatalogChangeRequest` must retain its existing review restrictions; legacy approval/canonical mutation remains unavailable.
- **G8 Runtime integration:** SQL-only isolated rollback tests do not replace authenticated live Prisma service E2E, migration approval or independent security review.

## Verification boundaries

- Previous AN-163B execution: five Jest suites, 45/45 tests PASS, TypeScript PASS, ESLint PASS, no tracked source changes.
- Previous AN-163C: read-only policy/contract evidence review PASS; HEAD `6c3ef0e`, exact four local worktree entries unchanged.
- AN-163D reruns focused regression tests, TypeScript and ESLint before commit. These remain local verification, not production acceptance.
- The AN-162 isolated PostgreSQL 18 rehearsal proved 27 chronological migrations and SQL-level ledger constraints. It did not migrate development/production or exercise an authenticated live Prisma end-to-end service.
- AN-160/162 migrations remain subject to an independently approved target-specific database rollout; 27 migration *files* in Git is not proof of database application.

## Scope restrictions / next decision

- This checkpoint does not grant `APPROVE`, `PUBLISH`, `REVOKE`, asset release, `CatalogCandidate` unquarantine, canonical writes, public GraphQL endpoints or activation of `PrivateEditorialWorkflowService`.
- No database migration, backfill, import, source/license decision, website deployment or schema change is authorized.
- Existing `apps/web/next-env.d.ts` and `apps/web/test-results/an146/.last-run.json` must remain untouched and excluded from Git checkpoint.
- Before designing a *write-capable* follow-up, user must separately approve the target subject and field allowlist. **Recommended first narrow design:** `ANIME` synopsis-only, with distinct reviewer approval, audited canonical snapshot write and later independent public release gate. Recommendation is not authorization.
- The AN-163 ticket is checkpointed as a policy-only foundation, **not a completed publication engine**. Keep G1–G8 blocked until their own implementation/approval evidence is accepted.
