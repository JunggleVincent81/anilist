# Anime-first Homepage and Navigation

The root route is anime discovery; `/feed` hosts social activity. Dark restrained design, no streaming, eligibility gates, genuine API-derived content and responsive accessibility are required.

> Consolidated technical reference. Earlier milestone status lines are historical; current status is specified in the phase completion report.


---

## 130 Header Navigation

*Historical source: `AN-130-HEADER-NAVIGATION.md`.*

Status: **LOCAL IMPLEMENTATION PENDING TEST ACCEPTANCE**
Baseline: main @ `7999820` (AN-129).

## Product intent
AniList is an anime information/tracking database with integrated social/community, **not an anime streaming service**. Keep the existing dark, clean, restrained visual system. Do not relabel the product publicly until naming/branding is approved by the owner. No new dependencies.

## Desktop navigation
- **Home** `/`, active only at `/`.
- **Anime** accessible dropdown: Browse Anime (`/discover`), Seasonal Anime (`/season`), Airing Schedule (`/schedule`). Anime routes including detail `/anime/[slug]` highlight this section.
- **Manga** and **Music** visible but inert/pending, no invented destinations; revisit when the respective domains have real pages.
- **Feed** `/feed` (new route) with active state.
- Preserve logo, search, notifications, account actions (profile, anime list, settings, logout), and keyboard focus behavior.

## Mobile navigation
- Five bottom actions: Home, Anime, Feed, My List, Profile/Sign in.
- Anime entry routes to existing anime discover page; Seasonal/Schedule accessible via mobile-header menu.
- Header preserves search and authenticated notifications bell.
- Future Manga/Music categories in header menu are explicitly disabled, not linked.

## Transition strategy
AN-130 makes `/feed` work as a route **before** changing `/`. Activity Feed remains rendered at `/` in this intermediate checkpoint, which is intentional. **AN-131 owns replacing `/` with the anime-first homepage and resolving any old navigation/notification paths that assumed `/` was the social feed.** Do not claim the Phase 11 homepage is complete after AN-130.

## Out of scope
No manga/music domain, no new anime ranking algorithms, no overhaul of styling, no database or GraphQL changes, no deployment, and no changes to existing account branding pending owner approval.

## Verification boundaries
Run frontend/backend tests, typecheck, lint, production builds, and Prisma migration status. Post-push confirm GitHub Actions. Responsive/manual browser walkthrough still required for true UX acceptance.


---

## 131 Feed Migration

*Historical source: `AN-131-FEED-MIGRATION.md`.*

Status: **implemented; acceptance pending full verification**.
Baseline: `200f280` (AN-130).

## What changes
- `/feed` becomes the dedicated social-feed page and continues to render the original, unmodified `ActivityFeed` component with Everyone/Following, composer, like, reply, pagination and session gates.
- `/` becomes a minimal **anime-first transition homepage**, with direct real links to Browse Anime (`/discover`), Seasonal Anime (`/season`), Airing Schedule (`/schedule`), and social Feed (`/feed`). This transition is NOT the completed Phase 11 homepage.
- Follow notifications still link to actor profiles; activity-like and activity-reply notifications now link to `/feed` instead of `/`.
- AN-128 and AN-130 regression expectations have been migrated rather than disabled; additional AN-131 contract tests guard page separation.

## Visual and product constraints
Retain existing dark, clean, restrained style. This product is an anime information, tracking, and social platform, **not a video streaming site**. The transition homepage deliberately has no fabricated anime spotlight, popularity metric, episode releases, manga/music destinations, streaming CTAs, or placeholder data.

## Next steps, separate tasks
- AN-132: real Featured Anime Spotlight backed by verified catalog data.
- AN-133: real Current Season and Airing Today modules.
- AN-134–AN-136: ranking, community previews, music/manga previews only when backed by actual eligible sources.
- AN-137: final responsive/manual UX audit.

## Verification boundary
Automated web/API tests, typecheck, lint, production builds, and Prisma migrate status run before commit. Manual browser UX with logged-in users and remote GitHub Actions still require independent verification. No migration or deployment.


---

## 132 Compact Anime Spotlight

*Historical source: `AN-132-COMPACT-ANIME-SPOTLIGHT.md`.*

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


---

## 133 Current Season Airing Today

*Historical source: `AN-133-CURRENT-SEASON-AIRING-TODAY.md`.*

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


---

## 137 Responsive Polish

*Historical source: `AN-137-RESPONSIVE-POLISH.md`.*

## Scope

- Preserve dark minimal anime-first discovery and existing Home/Feed separation.
- Stream the live Featured, Current Season/Airing, and Community sections separately through server React Suspense boundaries with accessible loading placeholders; avoid fabricated anime and reviews.
- Improve minimum touch targets for existing homepage calls to action and section links, maintain keyboard focus states, add compact useful Home footer.
- Preserve AN-132/133 age checks, AN-135 backend spoiler/age filtering, and the AN-130 responsive navigation.
- Add targeted regression coverage and rerun full frontend/backend quality gates prior to any Git checkpoint.

## Out of scope

- No new GraphQL requests, migrations, backend changes or dependency installs.
- No Manga/Music preview before real catalog/API data exist (AN-136 deferred).
- No site-wide Top Rated / Popular / Trending ranking without approved metadata (AN-134 blocked).
- No claims of live GraphQL, browser, accessibility tooling or CI success without independent execution.

## Manual QA still required

- Start backend+frontend and verify Home/Feed navigation with and without login.
- At narrow mobile widths (~320 / 375 px), tablet (~768 px) and desktop (>=1024 px), confirm no horizontal scroll, visible links, readable card wrapping and non-overlapping nav.
- Test slow/unavailable GraphQL server, empty and successful data states; verify Suspense fallbacks are replaced rather than staying forever.
- Keyboard tab from Skip to content through homepage CTA/footer; test reduced-motion preference and touch target usability.
- Check episode times in a browser timezone, spoiler masking and non-adult filtering; never assume NULL is false.
- Review GitHub Actions on the pushed commit, and run live authenticated browser QA before deployment approval.
