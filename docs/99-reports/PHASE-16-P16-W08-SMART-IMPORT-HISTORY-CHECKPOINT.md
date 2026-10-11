# AniList Phase 16 — P16-W08 Smart Import & History

**Date:** 2026-10-11
**Baseline:** `1c9285127a86fe4f54b4a79d0487be081956e875`

## Scope

- Private ADMIN-only CSV and XLSX imports across nine structured subject types; exact W04 field allowlists are reused.
- 64 KiB / 100-row server limits. UTF-8 CSV, standard sheet1 OOXML XLSX with deflate/STORE entries. No file bytes are stored; macros, formulas, external links and oversized or malformed archives are rejected.
- Persisted PREVIEWED dry-run ledger with SHA-256, source, row validation, duplicate summaries, and history. PREVIEWED does not write CatalogCandidate.
- Explicit separate apply with persisted ADMIN recheck, checksum match, invalid-row gate, ownership check, SERIALIZABLE transaction, duplicate fingerprint lookup and idempotent APPLIED result. Valid imported rows become quarantined CatalogCandidate records with import provenance and no public write.
- W07 review accepts exactly marked quarantined imports (with fingerprint and matching row metadata) while keeping W04 manual edit controls unchanged. Human reviewers remain distinct; approval/publishing remain unavailable.

## Known bounds and open acceptance

- Duplicate detection covers repeated normalized rows within the uploaded batch and previously fingerprinted staged candidates. Canonical cross-provider identity resolution is **not** inferred. Reviewer must resolve ambiguous canonical matches.
- Spreadsheet support intentionally excludes formula evaluation, complex worksheets and merged/interleaved rows. Export a flat CSV from Excel for unsupported XLSX sheets.
- One additive catalog import batch table and status enum are checked on disposable PostgreSQL only; development/production rollout is separately gated.
- W09 must validate full-browser interactions and real isolated HTTP/Prisma paths. Earlier regular Jest skips opt-in DB E2E.
- The W07 review service still does not approve, publish or commit canonical records. Imported metadata does not prove rights.
- Protected local files remain outside the implementation scope.

**Status:** W08 code checkpoint is complete only after local runner tests and non-force Git push PASS.
