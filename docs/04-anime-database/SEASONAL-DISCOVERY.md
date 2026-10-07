# Seasonal Discovery

## Purpose

Phase 4 adds a foundational seasonal catalog view using the existing anime
discovery API.

This is not the full airing schedule system planned for Phase 8.

## Route

```text
/season
```

## Season Model

Calendar mapping:

```
January–March   → WINTER
April–June      → SPRING
July–September  → SUMMER
October–December→ FALL
```

The default page derives the current season and year from the current date.

## Query Model

Seasonal discovery is implemented as an existing discovery query using:

```
season
seasonYear
```

No separate seasonal GraphQL endpoint is required.

## Navigation

The page supports:

- previous season;
- next season;
- explicit season selection;
- year rollover;
- pagination.

Example rollover:

```
WINTER 2026 ← FALL 2025
FALL 2026   → WINTER 2027
```

## Sorting

Phase 4 uses:

```
TITLE_ASC
```

for seasonal catalog results.

The bootstrap dataset does not yet provide sufficiently complete start dates
to make start-date ordering the default seasonal presentation.

## Public Eligibility

Seasonal results inherit the same public catalog rule as discovery:

```
catalogStatus = INCLUDED
```

## UI States

The route includes:

- loading state;
- error state;
- empty state;
- AnimeCard grid;
- pagination controls.

## Deferred to Phase 8

The following are explicitly outside Phase 4:

- weekly airing schedule;
- exact broadcast times;
- timezone-aware schedules;
- episode countdowns;
- streaming availability;
- personal airing notifications;
- richer current-season ranking and personalization.
