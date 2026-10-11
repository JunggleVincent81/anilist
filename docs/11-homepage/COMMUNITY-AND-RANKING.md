# Community Integration and Ranking Contract

Community updates and spoiler-safe reviews are previewed on Home. The weighted community ranking is first-party and must never be advertised as an official provider chart.

> Consolidated technical reference. Earlier milestone status lines are historical; current status is specified in the phase completion report.


---

## 134 Community Rating Implementation

*Historical source: `AN-134-COMMUNITY-RATING-IMPLEMENTATION.md`.*

Status: PATCH PREPARED — local tests, actual DB review counts, live GraphQL, browser QA and CI remain pending.

- This is an independently named **community-rated** chart, not the blocked external Top Anime metric or popularity/trending chart.
- Source: first-party `AnimeReview.score` (non-null, unique review per user/title).
- Restrict `Anime.catalogStatus=INCLUDED` and strictly `Anime.isAdult=false` in both aggregation and final title fetch. UNKNOWN excludes.
- Require at least three scored reviews per title; mean descending; count descending; anime ID ascending for deterministic ties. Top six only.
- Display both average (of 10) and scored review count. Empty/unavailable states do not fabricate data.
- No third-party poster rendering, age evidence promotion, schema migration, ranking based on external scores, or automatic catalog writes.
- AN-134 original external catalog ranking remains BLOCKED pending country and age evidence, provider score provenance, and a separately approved metric contract.
- Unit/integration tests for real DB aggregate shape, accessibility/browser walkthrough, CI and deployment still required before full acceptance.


---

## 134 Weighted Community Ranking

*Historical source: `AN-134-WEIGHTED-COMMUNITY-RANKING.md`.*

- Ratings source: local `AnimeReview.score` only. No external MAL/AniList scores, no official claim.
- Eligible anime: catalog `INCLUDED`, `isAdult = false`; missing age metadata is excluded.
- Minimum per title: 3 scored reviews, as before.
- Community mean C: mean of **all scored reviews belonging to eligible anime**.
- Weighted score: `(v * S + 10 * C) / (v + 10)` where `v` is scored-review count and `S` is the anime's raw mean. Weight 10 is a project policy choice, **not** claimed to be MAL's actual parameter.
- Sort weighted score descending, count descending, anime ID ascending; take 6 *after* weighting all eligible titles.
- Raw mean and weighted score both returned through GraphQL; homepage labels them separately.
- No data migration, seeding, popularity metric, external imports, or content rights changes.
- This is a small community-only ranking and will be empty until there are eligible user scores. Dedicated trending/popularity ranking remains separate future scope.
- Test gates: API and web tests, typecheck, lint, build, `git diff --check`, GraphQL runtime smoke, browser inspection.


---

## 135 Integrated Community

*Historical source: `AN-135-INTEGRATED-COMMUNITY.md`.*

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
