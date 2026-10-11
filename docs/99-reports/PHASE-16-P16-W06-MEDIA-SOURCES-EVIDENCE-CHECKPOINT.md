# AniList Phase 16 — P16-W06 Media, Sources & Evidence Checkpoint

**Date:** 2026-10-11
**Baseline:** `271601bc65efab22b9ebd921c431c0f8a1b460f9`
**Scope:** ADMIN-only human source/rights claim ledger and quarantined media metadata.

## Implemented

- New `CatalogSourceDossier` stores a curator's HTTPS source reference, publisher, manually written rights-basis claim, optional attribution/license label, optional expiry, and irreversible revocation timestamp.
- New `CatalogMediaIntake` stores only prospective image metadata linked to a persisted Anime and an active, owned source dossier: SHA-256, MIME, pixel dimensions, byte count and copyright-owner claim. No object bytes, upload, remote fetch, CDN keys or delivery URLs are processed.
- ADMIN-only GraphQL creates, reads, and owner-scoped source revocation; each write rechecks persisted ADMIN role, and media creation rejects missing anime, expired/revoked/foreign sources. Page responses distinguish missing migrations from empty results.
- Database-level enforced quarantine on both tables, duplicate metadata prevention, FK constraints, and additive migration. No migration applied to development/production.
- Non-indexed `/admin/catalog/evidence` route provides forms, inventory, revocation control, loading, error and unavailable states.

## Boundaries

- **Rights claims are not verified licenses.** Unexpired source records do not permit use or publication, and revocation does not automatically propagate to old assets, which remain separate and BLOCKED.
- Existing `CatalogEvidence`, `CatalogAsset`, `EditorialSynopsisEvidence`, Phase 15 service registration, canonical Anime fields, image URLs, publication workflow and legacy synopsis paths are unchanged.
- Human-independent rights verification, binding to actual editorial cases, publication/asset release, media binary inspection, and approved target database rollout remain future gates.
- Tests and disposable PostgreSQL rehearsal do not constitute integrated browser acceptance, addressed in W09.
- Protected local files `apps/web/next-env.d.ts` and `apps/web/test-results/an146/.last-run.json` are never staged.

**Status:** P16-W06 is complete only after code quality, isolated migration replay, exact 14-file Git checkpoint and non-force push all PASS.
