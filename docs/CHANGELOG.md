# Documentation Changelog

## 2026-10-10 — Documentation Consolidation (Phases 10–12)

### Changed
- Reorganized task-level AN notes into thematic Phase 10–12 documentation and three phase completion reports.
- Preserved original technical details and milestone reports in named phase documents and evidence appendices.
- Refreshed documentation index and roadmap; kept Phase 0–9 reports intact.
- Reconciled historical pending-migration statements with later observed applied development migrations.

### Scope
- Documentation-only refactor; no application changes, migrations, curated content, publication, or production deployment.

## 2026-10-09 — Phase 12 Private Admin Catalog

### Added
- Additive curation data schema, read-only protected dashboard, original private synopsis editor and revision-checked submission/review.
- Restricted REQUEST_CHANGES / REJECT decisions and independent reviewer protection.
- Local AN-146 security/browser acceptance, AN-147 audit evidence.

### Deferred
- Approve/publish canonical synopsis, image assets, production acceptance.

## 2026-10-09 — Phase 11 Anime-first Homepage

### Added
- New anime-first Home with spotlight, seasonal and airing previews, safe community pulse and review previews.
- Dedicated `/feed` route, weighted first-party community ranking, manga/music models/APIs/pages and explicit empty states.
- Candidate image metadata and eligibility draft policy without public artwork authorization.

### Deferred
- Curated manga/music content, provider rankings, external image licensing/rights approval.

## 2026-10-09 — Phase 10 Social and Production-readiness Baseline

### Added
- Activity likes/replies, anime reviews, social notifications, reports/moderation, feed and review/inbox UI.
- GraphQL request safeguards, health checks, CI and local production-mode smoke baseline.

### Clarified
- Phase 10 feed's original placement at `/` was superseded by Phase 11 `/feed`.
- Production-readiness baseline does not authorize production launch.

## 2026-10-08 — Phase 9 Achievements & Gratification

### Added

- persistent Achievement and UserAchievement domain
- permanent historical achievement unlocks
- 17-milestone initial achievement catalog
- achievement metric evaluation engine
- automatic tracking and favorite reconciliation
- authenticated manual reconciliation/backfill
- public and authenticated achievement GraphQL queries
- three-slot profile achievement showcase
- unlockable achievement titles
- `/user/[username]/achievements`
- profile achievement summary and showcase
- owner showcase and title controls
- Phase 9 validation and completion documentation

### Product Rules

- no XP system
- no account leveling
- no achievement currency
- no daily streak farming
- no rarity economy
- unlocks are never revoked when current metrics later decrease
- public achievement reads remain side-effect free

### Fixed

- corrected Base UI DropdownMenuLabel group composition
- corrected Link-rendered Button native semantics
- regression-validated profile navigation routes

### Validated

- Prisma achievement migrations
- achievement catalog and evaluator
- achievement reconciliation
- tracking and favorites integration
- GraphQL achievement API
- profile showcase and titles
- workspace typecheck and lint
- API and web production builds

## 2026-10-07 — Phase 5 Anime Detail

### Added

- real `/anime/[slug]` detail experience
- complete frontend anime detail GraphQL contract
- responsive anime hero and artwork fallbacks
- synopsis, taxonomy and studio presentation
- alternative titles and release metadata
- validated external provider references
- related anime navigation
- anime-specific loading, error and not-found states
- dynamic anime SEO and social metadata
- Phase 5 validation and completion documentation

### Hardened

- sparse bootstrap metadata is treated as a valid UI state
- obvious mojibake alternative titles are hidden at presentation time
- external links require stored valid HTTP/HTTPS URLs
- unknown relation semantics remain neutral instead of being inferred
- high relation counts are capped in the initial detail presentation

### Validated

- 15 API test suites passing
- 69 API tests passing
- workspace typecheck passing
- workspace lint passing
- API production build passing
- web production build passing
- anime detail runtime lookup passing
- not-found semantics passing
- discovery regression passing
- seasonal regression passing

## 2026-10-07 — Phase 4 Anime Database & Discovery

### Added

- canonical anime domain with internal UUID ownership
- anime titles, external provider mappings, genres, tags, studios and relations
- streaming JSONL anime importer
- external identity provider parsing and canonical merge policy
- dedicated Anime News Network identity support
- catalog eligibility with INCLUDED, REVIEW and EXCLUDED states
- public GraphQL anime lookup and discovery queries
- search, filtering, sorting and pagination
- real-data `/discover` experience
- foundational `/season` browsing
- Phase 4 validation and architecture documentation

### Fixed

- repaired a catastrophic canonical merge caused by ANN query IDs being discarded by the generic external-identity fallback
- rebuilt the anime catalog after identity repair
- restricted automatic canonical merging to trusted anime identity providers
- removed Base UI nested Button trigger composition warnings

### Validated

- 38,288 canonical Anime records
- 191,652 ExternalAnimeId records
- 31,270 INCLUDED
- 6,579 REVIEW
- 439 EXCLUDED
- 15 API test suites passing
- 69 API tests passing
- workspace typecheck and lint passing
- API and web production builds passing

## 2026-10-06 — Phase 2 UI Foundation

### Added

- shadcn/ui with Base UI and Nova
- semantic dark-first design system
- Geist typography system
- reusable Button, Input, Textarea, Select, Checkbox and Switch
- Dialog, Sheet, Dropdown, Tooltip and Tabs
- Avatar, Badge, Skeleton and toast feedback
- LoadingState, EmptyState and ErrorState
- PageContainer, ContentSection, SectionHeader and ResponsiveGrid
- desktop application shell
- mobile application shell
- AnimeCard and AnimeCardSkeleton
- internal `/dev/ui` showcase
- placeholder navigation routes for UI validation

### Changed

- primary palette adjusted for accessible foreground contrast
- form control boundaries increased in visibility
- keyboard focus indicators strengthened
- mobile interaction targets improved
- AnimeCard navigation reduced to one primary tab stop
- development scripts made compatible with native Windows execution
- Prisma Client regenerated after dependency reinstall

### Removed

- unused `next-themes` dependency

### Accessibility

- skip-to-content navigation
- reduced-motion baseline
- fixed/sticky navigation focus protection
- mobile safe-area support
- narrow-screen tabs overflow handling

## 2026-10-05 — Phase 1 Close-out

- Replaced the ephemeral scratch PostgreSQL dependency with a persistent project-specific local PostgreSQL cluster at `~/.local/share/anilist/postgres` on port `55435`.
- Added `pnpm db:start` and `pnpm db:stop` for local database lifecycle management.
- Updated environment and local-development documentation to reflect the persistent database setup.
- Final verification is performed with Node.js 24 and pnpm 12.

## 2026-10-05 — Phase 0 Complete

- Product diputuskan **anime-only**.
- Product pillars di-lock: Tracking, Discovery, Identity, Current Anime, Social.
- Manga dihapus sepenuhnya dari scope.
- Tracking statuses di-lock.
- Scoring model di-lock ke 1.0–10.0 dengan increment 0.5.
- Rewatch behavior ditentukan.
- Main page map dan navigation ditentukan.
- Achievement & Gratification System ditetapkan sebagai salah satu differentiator utama.
- Daily watch streak dan binge-oriented rewards ditolak.
- Data strategy diputuskan menggunakan provider adapter + normalization + database internal.
- AniList API tidak digunakan sebagai production database dependency.
- Tracker MVP ditetapkan berakhir pada Phase 6.
- Workflow development diputuskan manual oleh user; AI agent tidak digunakan untuk implementation berkelanjutan.
