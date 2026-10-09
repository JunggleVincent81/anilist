# AN-129 — Anime Reviews Frontend V1

## Scope

- Responsive Reviews section embedded on each `/anime/[slug]` detail page; anime metadata, relations, and other sections preserved.
- Public paginated anime reviews (10/page) and server-side aggregate scores.
- Credentialed authoring with optional title (<=150), optional score (1–10 in 0.5 increments), mandatory body (1–10,000), explicit spoiler flag.
- Backend-owned one-review-per-user-per-anime and owner-only edit/delete. Own review located through bounded `userReviews` pages; server enforces uniqueness and ownership regardless of UI.
- Spoiler title and body not rendered until explicitly revealed; hidden again on request. React escapes all freeform text.
- Explicit delete confirmation, no optimistic mutation state, clear success/error states, keyboard accessible inputs, page controls, and login gate.

## Backend contracts

GraphQL `animeReviews`, `animeReviewStats`, `userReviews`, `createAnimeReview`, `updateAnimeReview`, `deleteMyAnimeReview`. Existing shared authenticated client sends variables; no backend or database modifications.

## Limitations & follow-up

- Own review lookup is bounded to the first 1,000 user reviews; for extreme accounts the create mutation can yield a harmless duplicate conflict. No dedicated `myReviewForAnime` endpoint exists.
- GraphQL operation tests and anonymous live smoke are not substitutes for authenticated end-to-end browser coverage; before release, use two non-production accounts for write/edit/delete, spoiler disclosure, and paging.
- GitHub Actions status must be checked after push. No hosting deployment is performed.
