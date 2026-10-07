# Phase 6 — Tracking Domain

## Purpose

Phase 6 introduces the first complete anime tracking domain for the platform. A user can keep one personal tracking entry per anime and maintain status, episode progress, score, and rewatch information.

## Domain model

`AnimeListEntry` belongs to exactly one `User` and one `Anime`.

Core fields:

- `status`
- `progressEpisodes`
- `score`
- `rewatchCount`
- `startedAt`
- `completedAt`
- `createdAt`
- `updatedAt`

The database enforces a unique `(userId, animeId)` pair so one user cannot have duplicate tracking entries for the same anime.

## Statuses

The supported statuses are:

- `PLANNING`
- `WATCHING`
- `COMPLETED`
- `PAUSED`
- `DROPPED`
- `REWATCHING`

## Score rules

Scores are optional.

Valid values:

- minimum: `1.0`
- maximum: `10.0`
- step: `0.5`

A score may also be cleared back to `null`.

## Progress rules

`progressEpisodes` must be zero or greater.

If the anime has a known episode total, progress cannot exceed that total.

For anime with an unknown episode total, non-negative progress is allowed without an upper bound.

When a known-length anime is marked `COMPLETED`, progress is forced to the anime's total episode count.

## Rewatch rules

Entering `REWATCHING` without explicit progress resets progress to `0`.

Starting a rewatch does not increment `rewatchCount`.

A transition from `REWATCHING` to `COMPLETED` increments `rewatchCount`.

The first normal completion does not increment `rewatchCount`.

## Timestamps

`startedAt` is set when an entry first moves beyond `PLANNING`.

`completedAt` records the latest completion time.

## Catalog eligibility

Tracking is allowed only for anime whose catalog status is `INCLUDED`.

## Ownership

Mutation ownership comes from the authenticated session.

Clients do not provide an arbitrary `userId` for tracking mutations.

## Database integrity

Phase 6 adds database checks for:

- non-negative episode progress
- non-negative rewatch count
- score range
- score half-step precision

Migration:

`20261007121258_add_anime_tracking`
