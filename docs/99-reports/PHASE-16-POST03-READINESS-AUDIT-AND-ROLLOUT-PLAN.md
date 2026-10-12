# AniList Phase 16 — POST03 Release Readiness Audit & Rollout Plan

**Audit date:** 2026-10-12
**Pinned baseline:** `a297e2280965c65ab8f26e2abd08c050cdffd774` (POST02)
**Audit outcome:** `POST03_READ_ONLY_AUDIT_PASS / ACTIVE_ROLLOUT_NO_GO`
**Scope:** repository-only evidence review and decision/runbook. No live DB access, schema modification, deploy, secret collection, release approval, or content publication.

## 1. Evidence inventory and boundaries

| Workstream | Evidence | Decision |
| --- | --- | --- |
| W01–W09 admin workspace and mocked-browser acceptance | P16-W09 committed acceptance and earlier local Chrome 6/6 | PASS (synthetic GraphQL/browser scope only) |
| POST01 real HTTP NestJS/GraphQL/Prisma | Committed POST01 evidence: PostgreSQL 18, 33 SQL migrations, genuine loopback HTTP GraphQL and guarded synthetic fixtures (4/4) | PASS (disposable test scope only) |
| POST02 disaster-recovery rehearsal | Committed POST02 evidence: PostgreSQL 18, source/restore containers, constraints and trigger negatives, five fixture tables, 1,569 catalog objects with two exact-pinned PG18 CHECK decompilation exceptions | PASS (disposable synthetic backup/restore only) |
| CI/release workflow definition | `.github/workflows/ci.yml` defines Node 24, pnpm 12, PostgreSQL **16**, Prisma validation/generation/migrate deploy on isolated CI DB, API checks, production-mode API smoke, web quality/build | DEFINED; actual latest CI execution status NOT VERIFIED by this read-only audit |
| Production HTTP configuration | `apps/api/src/main.ts`, production-readiness guard, GraphQL CSRF and query-safety policy | Source controls present; live HTTPS/cookie/proxy settings NOT VERIFIED |
| Active development/staging/production database state | No live connection or `_prisma_migrations` access permitted in POST03 | UNKNOWN / NO-GO |
| Deployment target, credentials and recovery readiness | Real provider, selected database/version, grants, backup retention, recovery timing, monitored rollout unverified | UNKNOWN / NO-GO |

**Important version mismatch:** CI provisions PostgreSQL **16**, whereas POST01/POST02 ran on PostgreSQL **18**. Do not equate these with proof of production compatibility. Confirm the chosen target version and execute migration/restore tests on a version-matched staging clone before release.

## 2. Immediate release decision

**NO-GO for any active database migration, public deployment, canonical publication, unquarantine, data backfill, or editorial approval.** This is an evidence-based *hold*, not a failed application test. Scope-complete POST03 means the decision and plan are documented, not that a live release is authorized.

Do not infer any active schema status from the local **33** SQL scripts. POST01/POST02 replayed SQL in disposable containers; they did not inspect an active Prisma `_prisma_migrations` ledger, real customer data, or environment-specific drift.

## 3. Prerequisites before a change authorization request

1. **Target identity:** Explicitly name environment (development/staging/production), hosting services, API/web domains, DB engine/major version, isolated DB name (never credentials in a chat/report), owner, and maintenance window. Validate correct target independently.
2. **Current state (read-only first):** Obtain authorized read-only status of Prisma migration history and a reviewed schema diff, including triggers, functions, ownership, constraints and indexes. `prisma migrate status` is a *read* of history, not proof of zero drift; do not run migrations at this step.
3. **CI and artifact parity:** Verify the exact release commit passes hosted CI, Prisma validation/generation, API production smoke, web production build, and a version-matched isolated PostgreSQL integration run; confirm image/runtime versions and startup/health routing.
4. **Rights and role review:** Verify database least privileges, production secret sourcing and rotation, HTTPS/TLS, cookies/CORS/proxy topology, ADMIN role assignment, protected catalog actions, and media/synopsis rights. Keep internal approval/commit services unregistered unless separately authorized.
5. **Recoverability:** Establish protected production-grade backup storage, encryption, retention, restores on a separate target-equivalent environment, RPO/RTO thresholds, restoration ownership, and a timed dry run on realistic data volume. POST02's synthetic PostgreSQL 18 restore is not a substitute.
6. **Migration plan:** Review the exact ordered set of pending migrations against the live baseline; inspect required locks, possible table rewrites, large-table impact, and failure modes. Obtain a written forward-fix versus restore decision. Never assume a destructive `migrate reset`, `db push`, or automatic down-migration is safe.
7. **Operational observability:** Verify health endpoints (`/health/live`), logs without secrets, error monitoring/alerts, rollback decision ownership, deployment freeze mechanism and post-release integrity checks.
8. **Approval:** Present the above evidence, target, proposed commands, backup restore results and an explicit GO/NO-GO request to the human approver. **No approval is granted by this report.**

## 4. Staged rollout runbook — instructions, NOT authorized execution

**Gate A — Inventory and verification (read-only).** Identify the intended environment and expected HEAD, obtain written owner confirmation and least-privilege read access; inspect migration status/diff and CI/release artifact. STOP on mismatches or incomplete evidence.

**Gate B — Recovery rehearsal (isolated).** Restore a recent backup into a distinct, access-controlled, version-compatible environment. Measure restoration and smoke tests; verify row counts, schema, audit immutability, and content rights constraints. STOP if restore is not reproducible.

**Gate C — Approval.** Present migration SQL review, drift/lock analysis, RPO/RTO, monitoring plan, rollback method, and maintenance window. Obtain separate explicit approval naming the exact active target. Without that approval, remain NO-GO.

**Gate D — Controlled change (future, separately authorized only).** Deploy the verified artifact and ordered migrations via approved CI/release orchestration with a release lock, backups and monitoring. Do not use a local workstation environment-variable swap as a default production migration method. `prisma migrate deploy` applies pending migrations and by itself does not verify drift.

**Gate E — Post-change verification.** Confirm health, authenticated role boundaries, private quarantine/audit logs, schema migration ledger, performance, frontend API origin, and business queries. No synthetic fixtures or rights-unapproved catalog data on active servers.

**Gate F — Incident handling.** STOP changes on inconsistency. Prefer an approved forward fix where appropriate; any restore must be a separately authorized recovery action with an acknowledged data-loss window and communication plan. A previous backup cannot safely be replayed over new writes without explicit recovery planning.

## 5. Audit constraints and references

This static checkpoint does not access real credentials, hosting consoles, GitHub Actions run results, active database state, production logs or secret managers. It does not run CI or exercise deploy. No availability or security certification can be inferred from a source-only review.

- Prisma CLI v7: migration `status` and `deploy` documentation — https://www.prisma.io/docs/cli/v7/migrate/status and https://www.prisma.io/docs/cli/v7/migrate/deploy
- PostgreSQL 18: backup/restore documentation — https://www.postgresql.org/docs/18/backup.html
- Project: `.github/workflows/ci.yml`, `apps/api/src/main.ts`, `apps/api/src/config/production-readiness.ts`, `apps/api/src/graphql/graphql.module.ts`, `apps/api/prisma.config.ts` and three committed W09/POST01/POST02 acceptance reports.

**Final classification:** `POST03_READ_ONLY_AUDIT_PASS / ACTIVE_ROLLOUT_NO_GO`. Proceed only through separate evidence and approval gates.
