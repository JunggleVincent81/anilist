# AN-140C — Protected Admin Catalog Dashboard

Status: implementation milestone; verify quality logs and Git checkpoint before marking delivered.

## Authorized surface

- `adminCatalogOverview` and `adminCatalogPage` are GraphQL queries protected by the existing `RolesGuard` with `@Roles(UserRole.ADMIN)` on **each** resolver method. MODERATOR and USER are not delegated access. Server-side checks are authoritative; the browser role check is user experience only.
- New `/admin/catalog` page uses the existing authenticated GraphQL client (`credentials: include`) and current user context. Anonymous and non-ADMIN sessions do not send catalog queries and see appropriate denied states.
- Overview reports catalog status, missing canonical synopsis, missing canonical cover field, age unverified, and private change-request count. These counts are **not** approvals or rights verification.
- Listing supports bounded server-side pagination, title/slug search, catalog status, age flag. All statuses including REVIEW and EXCLUDED are visible exclusively to ADMIN.
- No raw image URLs are output into the new UI; a present `coverImageUrl` is *not* a rights approval. Excerpts of canonical synopsis are limited to 220 characters.
- No schema changes, migrations, mutations, age backfill, publishing actions, external URL fetches, storage writes or auto role assignments.

## Security and verification

- Unit tests check strict ADMIN decorator and guard metadata, bounded query input, and read-only Prisma methods.
- AN-140B development migration was previously verified by user: 19 migrations, six tables, 9 enums, 16 foreign keys, 38,288 pre-existing Anime rows intact.
- Browser, real admin-session GraphQL E2E, and moderator-denial live tests should be performed separately. The script only runs automated tests/builds; do not claim live tests from static gates.
- No account is granted ADMIN by this feature; role assignment remains a separate approval gate.
