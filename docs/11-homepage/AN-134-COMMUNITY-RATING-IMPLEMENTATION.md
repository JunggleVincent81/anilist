# AN-134 — Community-rated anime (bounded subset)

Status: PATCH PREPARED — local tests, actual DB review counts, live GraphQL, browser QA and CI remain pending.

- This is an independently named **community-rated** chart, not the blocked external Top Anime metric or popularity/trending chart.
- Source: first-party `AnimeReview.score` (non-null, unique review per user/title).
- Restrict `Anime.catalogStatus=INCLUDED` and strictly `Anime.isAdult=false` in both aggregation and final title fetch. UNKNOWN excludes.
- Require at least three scored reviews per title; mean descending; count descending; anime ID ascending for deterministic ties. Top six only.
- Display both average (of 10) and scored review count. Empty/unavailable states do not fabricate data.
- No third-party poster rendering, age evidence promotion, schema migration, ranking based on external scores, or automatic catalog writes.
- AN-134 original external catalog ranking remains BLOCKED pending country and age evidence, provider score provenance, and a separately approved metric contract.
- Unit/integration tests for real DB aggregate shape, accessibility/browser walkthrough, CI and deployment still required before full acceptance.
