# Local Development

## Prerequisites

- Node.js 24.
- pnpm 12.
- PostgreSQL available locally.
- Git.

The repository root is `C:\\Dev\\Projects\\anilist` on Windows or `/mnt/c/Dev/Projects/anilist` from WSL.

## Install

```bash
pnpm install
```

## Environment setup

Copy `.env.example` to `.env` and set a development PostgreSQL connection string. `.env` is ignored by Git.

```bash
cp .env.example .env
```

Required values are documented in `docs/01-foundation/ENVIRONMENT.md`.

## Database setup

Create an empty PostgreSQL database and set its connection string in `DATABASE_URL`. Phase 1 has no business schema or seed data.

Validate and generate Prisma Client:

```bash
pnpm prisma:validate
pnpm prisma:generate
```

## Run development

Start web and API together:

```bash
pnpm dev
```

- Web: `http://localhost:3000`
- API: `http://localhost:4000`
- GraphQL: `http://localhost:4000/graphql`

## Quality commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Health smoke test

Send this GraphQL query to `http://localhost:4000/graphql`:

```graphql
query {
  health {
    status
  }
}
```

The web foundation page also performs a minimal browser-side health query against `NEXT_PUBLIC_API_URL`.
