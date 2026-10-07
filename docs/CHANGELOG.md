# Documentation Changelog

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
