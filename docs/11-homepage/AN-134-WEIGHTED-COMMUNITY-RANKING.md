# AN-134-R2: Independent weighted community ranking

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
