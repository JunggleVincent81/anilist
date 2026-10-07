# Seasonal, Airing Schedule & Discovery+

## Status
Phase 8 implementation is complete.

## Seasonal Anime
Seasonal browsing uses the local canonical anime database with `season`, `seasonYear`, canonical metadata, and public catalog eligibility.

Only `catalogStatus = INCLUDED` anime may appear publicly.

The seasonal page supports current/previous/next season, explicit season/year selection, pagination, advanced discovery links, and airing schedule links.

## Discovery+
Discovery supports text search, format, release status, season, season year, title sorting, season-year sorting, and pagination.

Public discovery always applies `AnimeCatalogStatus.INCLUDED` as a mandatory base filter.

Genre, tag, and studio filtering remain available in the backend for future UI expansion.

## Start Date Limitation
The canonical INCLUDED dataset currently has no populated `startDate` or `endDate` coverage, so start-date sorting is not exposed in the Phase 8 UI.

## Airing Schedule
Local `AIRING` status is not treated as a schedule source because the audit found stale AIRING records and no usable local date coverage.

Future episode timing comes from AniList AiringSchedule. AniList provides schedule facts only: media id, episode number, and airing timestamp.

Canonical mapping:

```text
AniList AiringSchedule
        ↓
mediaId
        ↓
ExternalAnimeId(provider = ANILIST)
        ↓
canonical Anime
        ↓
catalogStatus = INCLUDED
        ↓
public AiringSchedule result
```

Unmatched or non-INCLUDED records are omitted.

## Airing Schedule API
Public GraphQL query:

```graphql
airingSchedule(days: Int)
```

Supported range: 1–14 days.

Frontend presets: 3, 7, and 14 days.

Invalid ranges return `BAD_USER_INPUT`.

## Runtime Cache
A short-lived in-memory cache with a 5-minute TTL reduces repeated upstream requests.

Phase 8 intentionally does not add schedule persistence, cron synchronization, or background ingestion.

## Frontend Schedule
`/schedule` provides real future airing data, day grouping, episode numbers, canonical anime links, loading/error/empty states, and responsive layout.

Server rendering uses deterministic UTC output; after hydration, display times use the viewer device timezone.

## Navigation
Phase 8 connects Discover ↔ Seasonal ↔ Schedule.

Desktop navigation exposes Discover, Seasonal, and Schedule. Search icons on desktop and mobile route to `/discover`.

## Explicit Non-Goals
Phase 8 does not add streaming, video hosting, fabricated schedules, popularity ranking without valid data, achievements, or social features.
