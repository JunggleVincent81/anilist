# Phase 11 — AN-130: Header and Navigation Restructure

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
