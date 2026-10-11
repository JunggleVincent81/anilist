# AniList Phase 16 — Post-W09 Real HTTP / Prisma Acceptance

**Baseline:** `b6d0b1c7303907c53f77e80447c215a7014f8146` (P16-W09 code/browser security checkpoint)

**Scope:** opt-in isolated acceptance test only; no production service, Prisma schema, frontend, or existing migration changes.

## What is tested

- All 33 committed SQL migrations are replayed into a fresh PostgreSQL 18 container with `--network none`, **no host PostgreSQL ports**, no host filesystem mounts, and no real application database URL.
- Real NestJS `AppModule` serves GraphQL HTTP **only on ephemeral `127.0.0.1`**. All application `PrismaService` injections are replaced with one genuine Prisma Client connected over the proven `docker exec -i` PostgreSQL byte stream.
- Synthetic DB-backed sessions exercise unauthenticated, USER, MODERATOR and ADMIN permissions (including spoofed request headers).
- Anime, Manga and Music structured drafts remain private/quarantined and canonical inventory counts unchanged.
- CSV import dry-run rejects formulas; invalid batches and invalid checksums cannot stage; imported rows are quarantined; apply is idempotent, batch ownership is enforced, history persists.
- Imported candidates enter independent editorial review with persistent transition audit; self-review, APPROVE and PUBLISH are refused; no canonical publication occurs.
- The acceptance suite is **skipped by default** during ordinary Jest runs and can only run with the controlled disposable Docker runner variables.

## Boundary and non-goals

- This does **not** authorize active development or production migrations, deployment, promotion of canonical data, media rights certification, age-classification approval, or opening the internal approval/commit services.
- Loopback HTTP is local to the testing workstation; the Docker database has no published host ports.
- Existing Phase 16 W09 browser/GraphQL-mock and prior AN-170 real Prisma service tests remain separate evidence. This acceptance adds actual HTTP GraphQL/Nest/Prisma together.
- Reported PASS requires the local runner log confirming migrations, HTTP Jest, full quality gates, exact staging, non-force commit and push. The file's presence alone is **not** a PASS.

## Follow-up operational gate

Before any active database rollout, require explicit target identification, tested backup **and restore**, privilege boundary review, actual migration diff, rollback plan, and explicit user approval. Deployment/readiness is separately gated. Any synthetic fixture content may exist only in the disposable database, never in real catalogs.
