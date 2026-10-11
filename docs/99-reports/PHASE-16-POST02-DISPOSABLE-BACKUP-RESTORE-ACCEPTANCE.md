# AniList Phase 16 — POST02 Disposable Backup / Restore Acceptance

**Date:** 2026-10-12
**Git baseline:** `f4138b6fe27591cd504fcc3d750fe6e09f378fe1` (POST01)
**Scope:** SQL migration audit, synthetic backup and restore only. No production source changes.

## Acceptance evidenced by local runner

- Replayed **33 committed sequential SQL migrations** on PostgreSQL 18 in a newly created `--network none` source container. No host ports or host filesystem mounts; a temporary in-container tmpfs is used for PostgreSQL data, with no active application database URL.
- Inserted **synthetic-only** fixtures: two ADMIN users; one APPLIED import batch; one fingerprinted quarantined candidate; one REJECTED editorial case; three human-review transition events across separate curator/reviewer identities.
- Verified on source and restored database that `CatalogImportBatch` APPLIED records reject UPDATE and DELETE, `EditorialCaseTransition` rejects UPDATE and DELETE, and an invalid APPLIED batch is rejected by its count/status CHECK constraint.
- Produced PostgreSQL 18 `pg_dump --format=custom --no-owner --no-acl`; verified archive TOC; restored with `pg_restore --exit-on-error --no-owner --no-acl` into an **independent, empty disposable PostgreSQL 18 container**.
- Compared ordered logical checksums of all rows in the five fixture tables and public schema manifests (tables, columns/defaults, views, constraints, indexes, enum values, triggers, function bodies). The 1,569 object fingerprints must match except two *exact-hash-pinned* PG18 CatalogImportBatch CHECK expressions; complete schema-only dumps may differ only on those exact two CHECK lines, and both databases must reject invalid counts/formats. This establishes bounded equivalence for the documented decompilation exception, **not byte-identical DDL**. **Schema check mode:** `PG18_TWO_PINNED_CHECK_DECOMPILATIONS_OTHER_1567_OBJECTS_IDENTICAL`. Any unrecognized schema or CHECK definition mismatch blocks finalization.
- Deleted both generated disposable containers. No synthetic database was left active.

## Evidence digests (synthetic fixtures only)

- Custom backup archive SHA-256: `aa9eef6bc20c154a4dcea1d00b61d4dc54dd624d76387f972ae6bf1da61d5831`
- Source/restored data-manifest SHA-256: `84907a8453986d846bdb59aad0904d6d17ac6de9cdbe3cc4a9e58e733f79ba39`
- Source catalog schema-manifest SHA-256: `baa15f03b348035ece676fe74812743f73b0039d53943021363eb550807c9aee`
- Restored catalog schema-manifest SHA-256: `48fe59a995dedf4a349eb0ec3cbd88cd185ff4360de6e984a147846cb23d2122`
- Schema acceptance mode: `PG18_TWO_PINNED_CHECK_DECOMPILATIONS_OTHER_1567_OBJECTS_IDENTICAL`

## Explicit exclusions and next approval gates

This was a **synthetic, offline acceptance test**. It does not validate an active environment's real data volume, backup storage/retention, encryption-at-rest, DBA credentials/role privileges, recovery time/RPO, or compatibility with an independently upgraded PostgreSQL major version. The raw SQL replay is not a substitute for Prisma's `_prisma_migrations` deployment history. No development or production migration, connection, canonical publication, unquarantine, or deployment was authorized or performed.

**Next: POST03 readiness and rollout planning (read-only).** Before any active DB operation, obtain explicit user approval with target identity, migration drift/status, tested backup and restore for that target, access safeguards, downtime expectations, and a documented rollback/recovery decision. Do not infer active rollout permission from this PASS.

**Checkpoint claim:** PASS only if the attached local execution log records migration replay, backup+restore, comparison, immutable negatives, source/target cleanup, exact Git staging, commit, and non-force push.
