# AN-140B — Additive Curation Schema Preparation

Status: **PREPARED; NOT DATABASE-APPLIED**.

## Additive persistence

- `CatalogChangeRequest`: Anime UUID, creator, field-specific proposal JSON, base Anime timestamp and optimistic draft revision.
- `CatalogEvidence`: evidence references and source provenance, separate from verification sign-off.
- `CatalogReviewDecision`: identified reviewer, policy version, track, draft revision, human decision; uniqueness stops duplicate same-track same-version signatures.
- `CatalogAsset`: private staging key, cryptographic hash, license references, storage delivery mode and revocation state; no automatic public URLs.
- `CatalogRevision`: future approved field snapshots for rollback and audit provenance.
- `CatalogProductionCountry`: origin candidates attached to request/evidence, not published country assertions.

Relations to existing Anime/User are additive **Prisma relation fields only**; no existing database columns, IDs, or tracking tables change. Foreign keys use `RESTRICT` to protect curation history against parent hard deletion. The proposed JSON patches and evidence URLs must later undergo strict service-level validation and MUST NOT be used to fetch arbitrary remote URLs.

## Approval and deployment gates

1. Review SQL at `apps/api/prisma/migrations/20261009180000_an140b_catalog_curation_foundation/migration.sql`.
2. Backup relevant data before any migration approval; rehearse schema on a dedicated isolated PostgreSQL test database and perform rollback rehearsal there.
3. Confirm no drift and expected baseline migration count (18) before applying; there will be **19 migration files**, with AN-140B deliberately pending on the local development DB.
4. Request explicit user approval for a *separate* migration application script. Do not manually run `prisma migrate dev/deploy/db push` yet.
5. After database application, independently test row integrity/counts, migration status, permission boundaries and failure recovery.
6. AN-140C read-only admin authorization and admin UI are separate work items; no GraphQL/resolver/routes here.

Rollback strategy: keep the schema/migration in Git until formally accepted; if cancelled before applying, use a scoped revert commit. If applied, do not drop curation tables on a live database without a separate backup, data audit, and approval.
