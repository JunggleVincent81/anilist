# Phase 11 — Anime-first Homepage and Integrated Community

## Purpose
Make `/` a compact anime database/discovery homepage (not a streaming frontpage), preserve dark clean UI, move the full activity feed to `/feed`, and include safe first-party community previews.

## Delivered scope
- Navigation with Home, Anime, Manga, Music and Feed; dedicated real Manga/Music pages are available but show truthful empty states where no curated records exist.
- Featured spotlight, Current Season, Airing Today, eligibility-aware image fallback.
- Community Pulse, spoiler-safe reviews, and first-party weighted community rankings.
- Responsive loading, empty/error and accessibility states.

## Ranking contract
Eligible included, verified non-adult anime; at least 3 scored reviews; weighted score `(v × S + 10 × C) / (v + 10)` with community mean `C`. It is **not** MAL/AniList/provider ranking.

## Remaining gates
Manga/music public catalogue data, externally sourced ranking, poster/background rights and publication, age/origin approval and production browser verification remain distinct approvals.

## Technical documentation
- [Homepage and Navigation](HOMEPAGE-AND-NAVIGATION.md)
- [Community and Ranking](COMMUNITY-AND-RANKING.md)
- [Eligibility, Manga/Music, Image Evidence](CATALOG-ELIGIBILITY-AND-MEDIA.md)
- [Phase 11 Report](../99-reports/PHASE-11-COMPLETION-REPORT.md)
