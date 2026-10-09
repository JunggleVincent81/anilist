# AN-132 — Compact Featured Anime Spotlight

Phase 11: Anime-first homepage with integrated community.

- Replaces the AN-131 transition introduction with **one** compact, dark-themed, responsive spotlight.
- The Home page fetches its featured title from the **current Japanese anime season** via existing `animeDiscovery` and `animeBySlug` GraphQL clients. It requires `isAdult === false` from the detail result before displaying any title/poster.
- Selection is deterministic: first eight candidates from a `TITLE_ASC` page of 24, prioritizing `AIRING` and available HTTP(S) cover URLs. This is **not** a ranking or a recommendation based on popularity.
- Shows the actual title, format/status/episodes, optional genres, sanitized short description, and at most one cover.
- `View details` opens the existing anime detail page. `Manage list` goes to that detail page where the existing authenticated tracking control already operates. It does **not** add a list item merely by clicking.
- Handles GraphQL connection errors, empty seasons, missing details, and unavailable posters without inventing anime records.
- `force-dynamic` avoids a build-time dependency on a running API and allows season rollover on a new request. Existing `/feed` is preserved.
- No video playback, streaming CTA, soundtrack catalog, manga catalog, ranking statistics, backend changes, migrations, or deployment.

Manual acceptance after tests: visit `/` with and without a running GraphQL API; check responsive layout, text overflow, cover behavior, detail/list navigation, and `/feed`. Test with a non-adult seasonal catalog entry and inspect browser network/errors.
