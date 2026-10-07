# Phase 6 — Tracking GraphQL API

## Public query

### `animeList(input)`

Returns a public anime list for a username.

Supported input concerns include username, optional status filter, page, and per-page count.

Only anime with catalog status `INCLUDED` are exposed.

A missing or invalid user resolves as `null`.

## Authenticated query

### `myAnimeListEntry(animeId)`

Returns the current authenticated user's entry for one anime.

Anonymous access returns GraphQL error code `UNAUTHENTICATED`.

## Authenticated mutation

### `upsertAnimeListEntry(input)`

Creates or updates the current authenticated user's tracking entry.

Supported mutation fields include:

- `animeId`
- optional `status`
- optional `progressEpisodes`
- optional nullable `score`

The authenticated session supplies ownership.

The service is authoritative for catalog eligibility, known-episode progress limits, score validation, completion progress, rewatch transitions, rewatch count updates, and tracking timestamps.

Domain validation failures are exposed as GraphQL `BAD_USER_INPUT`.

## Authenticated mutation

### `removeAnimeListEntry(animeId)`

Removes the current authenticated user's tracking entry for one anime.

Deletion is owner-scoped and returns a boolean.

## Returned entry data

Tracking entries expose entry id, status, episode progress, score, rewatch count, timestamps, and anime summary data.
