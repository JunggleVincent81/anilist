# AN-157A — Typed Anime–Manga Relations Completion Report

**Scope:** Additive AnimeMangaRelation model and AnimeMangaRelationType enum with real typed FK references to existing Anime and MangaWork. Single relation row per Anime/Manga/type, provenance required, unpublished by default. Existing public GraphQL, manga preview, numeric tracking and other canonical domains unchanged.

**Verification:** Prisma schema validation using dummy datasource; API TypeScript no-emit; focused ESLint and Jest (including legacy manga/music tests); isolated PostgreSQL 18 clean rehearsal of 24 sequential SQL migrations; positive fixture, five negative constraint cases, transactional rollback, zero persisted fixtures.

**Database boundary:** New isolated PostgreSQL cluster on WSL port 55441 only. No existing development/AN-154/155/156 DB modification, migrations, seeding, backfills or public publication. SQL-only rehearsal does not claim Prisma migration-history deployment or restored-catalog compatibility.

**Git boundary:** Only Prisma schema, migration, focused contract test and this report. All 67 previously existing out-of-scope worktree entries must be preserved. No push or deployment authorized.
