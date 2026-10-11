# AniList Phase 16 — P16-W07 Editorial Review & Audit Checkpoint

**Date:** 2026-10-11
**Baseline:** `c7205c0c94c81a98466908b2d9a89e687bc6b20e`

## Private-only delivery

- ADMIN-only case queue and detail view for **manually created quarantined** W02/W04 `CatalogCandidate` drafts.
- Draft case creation with persisted creator checks, serializable candidate-version locking, and no links to legacy change requests.
- Guarded transitions: SUBMIT, BEGIN_REVIEW, REQUEST_CHANGES, REJECT only. A different persisted ADMIN must review the creator's case; human reasons are mandatory for rejections/change requests. Existing AN-161A transition policy and AN-162 append-only revision ledger remain authoritative.
- Optimistic revision CAS and transition-audit insert in one transaction; no approval, publish, unquarantine, canonical mutation or media upload.
- Proposed-vs-canonical read-time snapshot for existing Anime, Manga Work, Music Track only. New record proposals have no canonical snapshot. It is NOT a persisted immutable baseline or evidence of approved provenance.
- No new Prisma migrations. Uses the existing Phase 15 editorial schema; active DB rollout still separately gated.

## Deliberate restrictions and follow-up

- Existing internal approval/commit services remain unregistered; this public app route is ADMIN-only and not a permission to use AN-165/AN-166 approval paths.
- Cases from legacy workflows or imported candidates are not opened through W07; W05 relation proposals and W06 source/media dossiers remain separate ledgers, not automatically eligible for editorial canonical commit.
- A REQUEST_CHANGES state returns to DRAFT, but linked candidate revisions cannot be edited by W02/W04. Substantive fixes require a fresh candidate/case; do not imply the existing draft was modified.
- This workflow **does not certify publication readiness**. Human rights, age classification, old/new baseline snapshots, independent review and source reconciliation remain required before a separate approval/canonical-commit gate.
- Ordinary Jest/TypeScript/ESLint/Build cannot replace browser E2E or active database rollout.
- Two unrelated local files remain protected: `apps/web/next-env.d.ts` and `apps/web/test-results/an146/.last-run.json`.

**Status:** Complete only after full local quality gates and scoped Git checkpoint PASS; W08/W09 open.
