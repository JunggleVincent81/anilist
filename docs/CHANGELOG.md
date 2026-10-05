# Documentation Changelog

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
