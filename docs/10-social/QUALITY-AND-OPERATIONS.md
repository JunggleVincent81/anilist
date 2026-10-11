# Quality, Security, and Production-Readiness Baseline

Application safeguards, GraphQL complexity limits, health endpoints, smoke checks, CI and environmental assumptions. Production deployment is not certified by this local work.

> Consolidated technical reference. Earlier milestone status lines are historical; current status is specified in the phase completion report.


---

## 125 Quality Hardening

*Historical source: `AN-125-QUALITY-HARDENING.md`.*

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


---

## 126 Production Readiness

*Historical source: `AN-126-PRODUCTION-READINESS.md`.*

Status: Implementation completed; real production launch requires separate approval and checks.

## Delivered
- Production environment validation (HTTPS frontend origin; PostgreSQL URL)
- `API_PORT` / injected `PORT` compatibility
- HTTP `GET /health/live` (no dependency check)
- HTTP `GET /health/ready` (database ping, sanitized 503 on failure)
- `next start` uses Next.js default or platform-provided `PORT`
- Read-only smoke at `scripts/production-smoke.mjs`
- GitHub Actions CI with isolated PostgreSQL and full API/FE gates
- Local production-mode runtime verification with automatic process cleanup

## Environment
See `.env.production.example`. Store real credentials in host secret storage; never commit `.env` or credentials.
`NODE_ENV=production`; `WEB_URL` is exactly one HTTPS frontend origin (no path); `DATABASE_URL` is PostgreSQL; public API must terminate TLS at a trusted edge.
Configure `NEXT_PUBLIC_API_URL` during frontend build, not only at runtime.
`API_PORT` overrides the host-provided `PORT` when set. Remove local `API_PORT=4000` if platform mandates `PORT`.

## Deployment Runbook (platform-neutral)
1. Choose hosting and domains, configure managed PostgreSQL and encrypted backups.
2. Add protected environment variables in host settings. Configure HTTPS and allowed browser origin.
3. Run `pnpm install --frozen-lockfile`, Prisma generate, API/web builds in a trusted build environment.
4. **With approval and backup**, run `pnpm --filter @anime-platform/api exec prisma migrate deploy` against the actual target DB. Never use `prisma migrate dev` against production.
5. Start API: `pnpm --filter @anime-platform/api start`. Start web: `pnpm --filter @anime-platform/web start`.
6. Configure process restart, TLS, telemetry/alerts, dependency health checks, and rollback.
7. Check `/health/live`, `/health/ready`, and GraphQL from the production network using the smoke script.

```bash
API_PUBLIC_URL=https://api.example.com WEB_PUBLIC_URL=https://frontend.example.com SMOKE_CHECK_PRODUCTION=1 node scripts/production-smoke.mjs
```

The smoke script makes **read-only** requests. No user accounts or data are created. External availability, backups restoration, alert routing, credentials, DNS, and production performance are **NOT verified** by local passing tests.

## Safe Rollback
- Keep a tagged previous deploy artifact and a verified backup.
- Roll back application revision first if the DB schema is backward-compatible.
- For incompatible schema changes, plan forward-fix / restore with operator approval; do not automatically revert applied migrations.
- Verify health and critical user journeys after rollback.

## Release Boundary
AN-126 is engineering readiness work; it does not select a vendor, deploy live, or mark the site production-approved.
