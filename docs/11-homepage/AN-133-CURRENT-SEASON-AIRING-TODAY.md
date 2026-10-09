# AN-133 — Current Season & Airing Today

Phase 11: Anime-first Homepage & Integrated Community. Baseline: AN-132 / `7dc7210`.

## Content & UI

- Add one two-column desktop / one-column mobile section immediately after the existing compact spotlight; keep browse links and the community CTA.
- **Current Season**: current calendar season through existing `animeDiscovery`, four small poster cards maximum, linking to existing anime detail and season views.
- **Airing Today**: upcoming episode times from existing `airingSchedule(days:3)`; client shifts UTC server display to browser-local timezone after hydration; show at most four verified future entries matching the browser's calendar day.
- Unknown/adult anime are excluded: summary types carry no adult information. Each candidate requires detail `isAdult === false` and matching id/slug. Errors and empty states do not invent records.
- Selection is a bounded deterministic catalog preview, **not** a rating, popularity list, verified past episode release list, or recommendation engine.
- No streaming CTA/player or new manga/music domain. No migrations, server changes, dependencies, or deployment.

## Manual checks still required

Test with and without API running; verify current season items and time-zone-sensitive schedule with real records; check mobile overflow and disabled image fallback. Authenticated navigation remains in the original detail and Feed modules. CI remote status must be checked separately.
