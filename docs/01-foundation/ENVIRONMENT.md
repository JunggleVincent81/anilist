# Environment

All values below are development configuration names only. No secrets are stored in this document.

| Variable | Required | Example | Purpose |
|---|---:|---|---|
| `NODE_ENV` | No | `development` | Runtime environment. |
| `API_PORT` | No | `4000` | Port used by the NestJS API. |
| `WEB_PORT` | No | `3000` | Port used by the Next.js web app. |
| `WEB_URL` | No | `http://localhost:3000` | Allowed web origin for API CORS. |
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:4000/graphql` | GraphQL URL used by the browser foundation check. |
| `DATABASE_URL` | Yes | `postgresql://anilist@127.0.0.1:55435/anime_platform?schema=public` | Persistent project-local PostgreSQL connection used by Prisma. No password is stored in the example. |

Copy `.env.example` to `.env` for local development. `.env` and other environment-specific files are ignored by Git.
