# Phase 15 — AN-161 Workflow Policy & Internal Service Checkpoint

**Date:** 2026-10-11
**Status:** PASS for local, non-activated code scope
**Pre-implementation baseline:** `9d53aa90fd9873e30298cc69fc8f3c1321484b78` (AN-160)
**Phase:** 15 — Editorial Governance & Publication Engine
**Task:** AN-161 — Workflow Policy & Legacy Compatibility

## Delivered

- **AN-161A: Private editorial workflow policy** — standalone policy for `SUBMIT`, `BEGIN_REVIEW`, `REQUEST_CHANGES`, and `REJECT`, with explicit state transitions and revision increments.
- **AN-161B: Internal transactional service** — reads the persisted `EditorialCase` record and uses a Prisma transaction with optimistic revision compare-and-swap (`updateMany`).
- ADMIN-only permission checks, opener-only draft submission, independent reviewer for review transitions, validated review notes, and stale revision rejection.
- Linked legacy `CatalogChangeRequest` cases are explicitly rejected by the generic policy/service, preserving the existing private synopsis workflow.
- Fail-closed paths for `APPROVE`, `PUBLISH`, `REVOKE`, canonical writes, and other operations not approved for AN-161.

## Code artifacts

1. `apps/api/src/admin-catalog/editorial-workflow-policy.ts`
2. `apps/api/src/admin-catalog/editorial-workflow-policy.spec.ts`
3. `apps/api/src/admin-catalog/private-editorial-workflow.service.ts`
4. `apps/api/src/admin-catalog/private-editorial-workflow.service.spec.ts`

## Verification

- AN-161A/AN-161B focused Jest suites and legacy synopsis/curation regression: **PASS**.
- API TypeScript no-emit: **PASS**.
- API ESLint with zero warnings: **PASS**.
- Pre-existing Prisma schema, AN-160 migration, legacy services, admin module/resolver and two local web files: protected from this checkpoint.
- Strict staging allowlist: exactly four AN-161 source/test artifacts and this document.

## Explicit limitations and blocked activation

- Service is **not registered** with the NestJS module, GraphQL resolver or HTTP controller, so there is no new public/API workflow.
- Tests use mocked Prisma transactions; **no AN-161 database-backed transactional acceptance has been performed**.
- Review note, per-transition audit event and durable decision history are **not stored** by the AN-161B service. A durable audit trail must be designed and verified in AN-162 before activation.
- `CatalogCandidate` and `EditorialCase` from AN-160 remain code/schema foundation only on development/production until separately approved and migrated.
- No development/production migration, backfill, import, canonical write, change to age/rights eligibility, publication, deployment or automatic approval is authorized by this checkpoint.
- The current design does not provide end-to-end workflow acceptance. Do not mark the editorial engine production-ready.

## Next gate

**AN-162:** Review decisions, revision/audit history, security and transactional consistency design and tests. Require explicit scope approval before persisting new editorial actions. Maintain isolated database rehearsal and target-specific migration approval gates.
