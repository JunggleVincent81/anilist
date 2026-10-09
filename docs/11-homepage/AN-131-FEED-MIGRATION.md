# Phase 11 — AN-131: Activity Feed Cutover

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
