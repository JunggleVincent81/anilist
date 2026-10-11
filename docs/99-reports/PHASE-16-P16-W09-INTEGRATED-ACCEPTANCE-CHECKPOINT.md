# AniList Phase 16 — P16-W09 Integrated Acceptance Checkpoint

**Baseline:** `e972ddcb318811b0a52afe525295b6fcd8964855`
**Scope:** Automated acceptance evidence only; no feature changes, database writes, migrations, public API, or publication.

## Tests and boundaries

- New API Jest suite checks the registration and ADMIN RolesGuard metadata of all catalog workspace queries and mutations, plus the absence of approval, publication, unquarantine, media upload and canonical commit endpoints.
- New Playwright Chromium suite runs the actual Next.js application in a temporary detached Git worktree, with a deliberately mocked GraphQL endpoint at a guaranteed non-resolving .invalid hostname. There is no connection to a real API or PostgreSQL.
- Browser paths: anonymous/USER/MODERATOR denial, ADMIN rendering/noindex across nine admin pages (dashboard; Anime, Manga, Music; and five private workflow pages), desktop/mobile layouts including horizontal overflow check, Quick Add draft, read-only AnimeEpisode relationship, rejected formula preview and explicit guarded import confirmation.
- Failure to start the browser, missing Chromium, unavailable Next.js server, unsuccessful assertions or protected file changes means W09 cannot pass. No fallback to static-only "success".
- The runner repeats all ordinary API Jest, API/Web TypeScript and ESLint, NestJS build, and web Node contract tests. It protects the two pre-existing modified/untracked local paths, stages only the acceptance files, and performs a non-force push only after gates pass.

## Acceptance exclusions: separate evidence required

- Browser GraphQL is synthetic and must **not** be represented as a real end-to-end NestJS/Prisma authorization or data-integrity test.
- The existing 33 migrations were replayed on disposable PostgreSQL in W08. The five opt-in real-Postgres E2E tests remain skipped by ordinary Jest.
- Real browser + real NestJS + fully isolated PostgreSQL integration, operational deployment acceptance, backup/restore approval, development or production database rollout, and real-world rights attestations remain independently gated.
- A successful W09 code checkpoint therefore concludes the *mocked-browser and existing automated safety test tranche* only; do not label the entire Phase 16 deployed or production-ready.

**Status:** PASS only after local runner confirms real Chrome-channel browser tests and scoped Git checkpoint. Full real service/database acceptance is separate and OPEN.
