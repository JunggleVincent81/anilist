# AN-126 — Production Readiness Baseline

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
