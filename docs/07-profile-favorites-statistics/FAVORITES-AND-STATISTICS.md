# Phase 7 Domain Notes

## Favorites

Persistence: `AnimeFavorite`

Fields:
- id
- userId
- animeId
- createdAt

Constraints:
- unique `(userId, animeId)`
- index `animeId`
- index `(userId, createdAt)`
- cascade delete to User and Anime

Rules:
- only `catalogStatus = INCLUDED` can be favorited/read publicly
- mutations use authenticated user ownership
- add is idempotent
- remove of missing record returns false
- removal remains possible even if catalog eligibility later changes
- public ordering: newest first, then id
- no manual ranking in Phase 7

Frontend:
- `apps/web/src/lib/graphql/favorites.ts`
- `anime-favorite-toggle.tsx`
- `anime-favorites-grid.tsx`
- `/user/[username]/favorites`

## Statistics

Statistics are derived live, not stored.

Sources:
- AnimeListEntry
- AnimeFavorite
- anime genre relations

Only INCLUDED anime are counted.

Top genres are ordered by count descending then name alphabetically, limited to 10.

`episodesLogged` = sum of current `progressEpisodes`.
It is not lifetime episode consumption because tracking stores current state, not event history.

Mean score uses only scored entries and returns null when none are scored.

Frontend:
- `apps/web/src/lib/graphql/statistics.ts`
- `/user/[username]/statistics`
- profile statistics preview
