# AN-125 — API Quality Hardening

Date: 2026-10-09
Scope: Phase 10, backend request safeguards.

## Changes

- Apply a 128 KiB JSON and URL-encoded request body limit to Nest Express.
- Remove Express `X-Powered-By` exposure.
- Set `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy: no-referrer`, and `Cache-Control: no-store`.
- Add GraphQL validation budgets: 16 field nesting levels, 300 expanded
  field selections, 40 aliases per operation.
- Recursively expand fragment spreads, counting reuse for budget purposes.
- Reject malformed/abusive requests before GraphQL resolver execution.
- Retain existing CSRF prevention, production introspection restriction,
  session security, CORS allowlist, and global DTO validation.

## Compatibility

- Applies to all GraphQL queries and mutations; excessively deep or wide
  legitimate operations must be redesigned into smaller requests.
- Structural limits are not a substitute for a database query cost model.
- Request size limit does not replace per-field/domain validation.
- No changes to Prisma schema, migrations, or user data.

## Explicitly Deferred

- Distributed login-rate limiting and bot mitigation.
- Query-specific database execution timeouts and production load testing.
- Multi-node deployment, monitoring, backups, and reverse-proxy/TLS settings.

## Verification

Automated tests check normal requests, deep operations, aliases, wide
selections, and fragment expansion. Runtime smoke checks working GraphQL,
rejected abusive requests, HTTP 413 on oversized bodies, and security headers.
Full API regression, typecheck, lint, build, and migration status are required.
