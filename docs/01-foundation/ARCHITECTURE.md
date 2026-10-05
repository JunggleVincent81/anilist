# Phase 1 Architecture

## Scope

Phase 1 establishes the project foundation only. Anime, user, authentication, tracking, achievement, social, and other domain modules are intentionally deferred.

## Monorepo layout

```text
apps/
├── web/          Next.js 16.3.x App Router frontend
└── api/          NestJS 12 GraphQL API

packages/
└── shared/       Minimal shared TypeScript foundation package

docs/
├── 00-product/  Locked Phase 0 product decisions
├── 01-foundation/ Phase 1 technical documentation
└── 99-reports/  Phase completion reports
```

pnpm Workspace is used because the repository has a small number of applications and packages. It provides workspace dependency management and recursive scripts without introducing an additional orchestration layer such as Turborepo.

## Frontend

The web application uses Next.js 16.3.x with the App Router, TypeScript, React, Tailwind CSS, and ESLint. The page is a foundation page only and performs a minimal GraphQL connectivity check against the API.

Target URL: `http://localhost:3000`

## Backend

The API uses NestJS 12, TypeScript, GraphQL code-first, and Apollo. Only a `health` query exists in Phase 1. No auth, users, anime, tracking, achievement, social, or business modules are included.

Target URL: `http://localhost:4000`

GraphQL endpoint: `http://localhost:4000/graphql`

## GraphQL

The GraphQL schema is generated from NestJS decorators. Apollo is the GraphQL driver. The foundation query is:

```graphql
query {
  health {
    status
  }
}
```

Expected response when API and PostgreSQL are available:

```json
{
  "data": {
    "health": {
      "status": "ok"
    }
  }
}
```

## Database and Prisma

PostgreSQL is the development database. Prisma ORM 7 is configured under `apps/api/prisma/` with a minimal foundation schema and no business/domain models. Prisma Client is generated into an ignored generated-source directory and uses the PostgreSQL adapter.

The health service executes `SELECT 1` through Prisma to prove the API-to-database connection.

## Request/data flow

```text
Browser / Next.js
      ↓ POST /graphql
NestJS GraphQL + Apollo
      ↓ health resolver
HealthService
      ↓ Prisma Client
PostgreSQL
      ↑ status: ok
```

## What is intentionally not included

- Anime schema or provider adapter.
- User, auth, profile, or account modules.
- Tracking, statistics, achievements, social, reviews, or notifications.
- REST as the primary API.
- Redis, BullMQ, MongoDB, Turborepo, or speculative infrastructure.
- Production deployment configuration.
- Design system or anime UI.
