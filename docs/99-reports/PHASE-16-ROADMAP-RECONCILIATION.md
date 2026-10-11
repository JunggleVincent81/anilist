# AniList Phase 16 — Roadmap Reconciliation and Workspace Execution Plan

**Date:** 2026-10-11
**Original planning scope:** Complete Admin Catalog Workspace
**Historical baseline:** `26ef0fe211231ce1ae488081311f363837b9582a` (Phase 15 private foundation)

## Why task identifiers need reconciliation

The approved Master Roadmap v2.0 assigned AN-148–152 to Phase 13, AN-153–158 to Phase 14, AN-159–164 to Phase 15, and AN-165–170 to Phase 16. Later implementation used AN-165–168 for Phase 15 internal editorial foundations. Those artifacts were checkpointed and pushed with their historical names; do not rename commits or rewrite history. AN-169A and AN-170 are subsequent private evidence and real-Prisma integration work.

To keep the **original Phase 16 objective** intact while preventing collisions with AN-171 onward, outstanding admin-workspace deliverables use IDs **P16-W01–P16-W09**. These are execution identifiers, not retrospective renaming of committed tasks.

## Verified current state

- Phase 13: design and physical blueprint locked; historical age-eligibility findings remain open.
- Phase 14: additive AnimeEpisode, manga volume/chapter, canonical music and cross-domain relations locally checkpointed; live database rollout deferred.
- Phase 15: internal editorial foundation and block-by-default publication gates locally checkpointed in `26ef0fe`; live UI/publication not activated.
- Phase 16 AN-169A: private human evidence-attestation service with independently checked actor; mocked Jest tests passed. Not public.
- Phase 16 AN-170: five real Prisma Client/service E2E scenarios PASSED in disposable PostgreSQL 18, with 30 SQL migrations and no host ports; rollback, idempotency, rights revocation and concurrent-approval checks included. This does **not** prove deployment readiness.

## Mandatory remaining Phase 16 work

| ID | Outcome | Acceptance boundary |
| --- | --- | --- |
| P16-W01 | Admin Dashboard | Authenticated admin overview, truthful Anime/Manga/Music/candidate/review aggregates, loading/empty/error states |
| P16-W02 | Anime Manager | Search, filter, pagination, candidate draft/edit and safe navigation; no implicit public writes |
| P16-W03 | Manga & Music Managers | Manga works/volumes/chapters and music artists/recordings/releases/credits, curated private management |
| P16-W04 | Quick Add and Full Editors | Draft-first forms with domain validation, provenance and conflict handling |
| P16-W05 | Relation Manager | Typed Anime–Manga/Music/episode relations with duplicate and invalid-link protection |
| P16-W06 | Media, Sources and Evidence | Media metadata, source/rights attestation, expiry/revocation; separate publication/asset gates |
| P16-W07 | Editorial Review and Audit | Diff, independent human review, reason, history, private canonical-commit readiness |
| P16-W08 | Smart Import and History | Audited staged CSV/XLSX import with dry-run, validation, deduplication, no auto-publication |
| P16-W09 | Integrated Acceptance | Accessible/responsive UI, backend permissions, negative authorization testing, real browser flows |

## Gates that remain separate and blocked

- No Phase 14–16 migration to development/production PostgreSQL without independently approved backup/restore and target-specific rollout.
- No new public endpoints, publication, asset release, candidate unquarantine, rights inference, unknown/adult age inclusion or deployment without independent review.
- Services in AN-165/166/169A remain deliberately unregistered in NestJS; test actors are synthetic and do not establish real-world licensing.
- AN-170 spec is opt-in: ordinary API Jest skips the isolated Docker E2E tests. Run real service E2E only using a freshly verified disposable container with `network=none`, no ports, no mounts.
- Local web files `apps/web/next-env.d.ts` and `apps/web/test-results/an146/.last-run.json` remain outside these checkpoints.

**Status:** Phase 16 COMPLETE ADMIN CATALOG WORKSPACE **IN PROGRESS**; P16-W01–W09 are required before closure.
