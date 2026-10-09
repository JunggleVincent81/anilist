# AN-135 — Integrated Community Pulse & Reviews

## Scope
- Home `/` includes compact **Community Pulse** (bounded public text updates) and **Community Reviews** (latest three confirmed non-adult, non-spoiler reviews), using real backend data and no fabricated statistics.
- Existing full activity feature remains at `/feed`; review composition/editing stays on anime detail pages.
- The public feed preserves users' activity visibility preferences. Homepage only displays text-only activity (never titles of unverified anime in the pulse).
- Review query: `recentPublicAnimeReviews` returns up to 3 reviews newest-first, where `isSpoiler=false`, `anime.catalogStatus=INCLUDED`, and `anime.isAdult=false`.
- `isAdult=null` is never treated as false. Since the AN-134A audits found 38,288 age flags UNKNOWN, this review preview may be empty until the provenance program is approved.
- Independent GraphQL requests and `Promise.allSettled` prevent either failure from breaking the whole Home.
- User-authored TEXT updates may contain unmarked spoilers; UI warns about this. Explicitly marked reviews are excluded. No guarantee about user mislabeling.
- No rating aggregation, global ranking, synthetic reviews, streaming UI, new DB schema, dependency, or deployment.

## Acceptance
- Backend review query filters before fetching; deterministic newest-first order and fixed cap.
- Home source remains server-rendered, responsive, accessible, with graceful empty/error states.
- Tests, TypeScript, lint, builds, Prisma status, exact-scope Git checkpoint only after PASS.
- GitHub Actions, live API and authenticated browser QA must be checked separately.
