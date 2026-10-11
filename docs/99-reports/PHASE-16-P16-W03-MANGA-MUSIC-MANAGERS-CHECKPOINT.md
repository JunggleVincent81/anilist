# Phase 16 — P16-W03 Manga & Music Managers

**Date:** 2026-10-11
**Status:** Code and tests subject to local runner verification; not publication acceptance
**Baseline:** `1608acd0f3521e51b384818dcc9ab5cc79047d3d`

## Scope

- ADMIN-only GraphQL canonical inventory across MangaWork, MangaVolume, MangaChapter, AnimeMusicTrack, MusicArtist, MusicRecording, MusicRelease, MusicReleaseTrack and MusicCredit.
- Two dark responsive private management pages `/admin/catalog/manga` and `/admin/catalog/music`, one shared UI, controlled search, type selection, private/published flag filter, pagination, loading/error/empty states.
- Explicit missing-migration `P2021`/`P2022` unavailable response (not false zero); unrelated query errors remain errors.
- No candidate staging mutation, canonical edits, publication or rights assertions. Staging and full structured forms are in P16-W04; relation management P16-W05.
- Existing W01 and W02 workflows preserved; navigation added from admin catalog dashboard.

## Verification expected

- Whole API Jest (with opt-in isolated AN-170 excluded from ordinary run), API TypeScript, ESLint, NestJS Build.
- Whole Web Node tests, TypeScript, ESLint.
- Strict 12-file scope with two unrelated web worktree files protected; non-force Git push only if all gates pass.

## Constraints

- No Prisma schema change or migration; no DB read/write during runner tests other than mocks.
- Development/production database rollout separately approved; canonical records may be unavailable until migrations are applied.
- No `isPublished`/`isAdult` mutations, age inference, public release, streaming or asset rights authorization.
- Frontend/browser acceptance remains P16-W09; this task does not claim that the website is fully operational in development/production.
