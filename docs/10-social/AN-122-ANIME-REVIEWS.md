# AN-122 — Anime Reviews

Status: Implemented
Phase: 10 — Social
Date: 2026-10-09

## Objective

Allow authenticated users to publish, edit, and delete
anime reviews. Provide public review discovery, optional
scoring, spoiler metadata, and aggregate statistics.

## Functional Scope

- One review per user per anime.
- Optional title, maximum 150 characters.
- Required body, maximum 10,000 characters.
- Optional score from 1.0 to 10.0 in 0.5 increments.
- Optional spoiler flag.
- Publish, edit, and delete with authentication.
- Only review owners can edit their reviews.
- Public anime review feed.
- Public user review feed.
- Individual review lookup.
- Aggregate review statistics.
- REVIEW_PUBLISHED activity integration.

## Database

Entity: AnimeReview

Fields:
- id: UUID primary key
- userId: UUID foreign key to User
- animeId: UUID foreign key to Anime
- title: nullable VARCHAR(150)
- body: VARCHAR(10000)
- score: nullable DECIMAL(3,1)
- isSpoiler: Boolean
- createdAt: DateTime
- updatedAt: DateTime

Integrity:
- UNIQUE(userId, animeId)
- Nonempty body CHECK
- Nonempty optional title CHECK
- Valid optional score CHECK
- Cascading foreign keys
- Deterministic pagination indexes

Migration:
20261009014238_add_anime_reviews

## GraphQL Queries

- animeReview(id: ID!)
- animeReviews(animeId: ID!, input: ReviewFeedInput)
- userReviews(username: String!, input: ReviewFeedInput)
- animeReviewStats(animeId: ID!)

## GraphQL Mutations

- createAnimeReview(input: CreateAnimeReviewInput!)
- updateAnimeReview(input: UpdateAnimeReviewInput!)
- deleteMyAnimeReview(id: ID!)

## Pagination

Page-based pagination.

PageInfo fields:
- page
- perPage
- total
- pageCount
- hasNextPage
- hasPreviousPage

Default perPage: 20
Maximum perPage: 100

Ordering:
createdAt DESC, id DESC

## Aggregate Statistics

- totalReviews: number of reviews
- scoredReviews: reviews containing a score
- averageScore: average among scored reviews only

The review score is independent from the user's
anime-tracking score.

## Authorization

Creation, modification, and deletion require an
authenticated user.

Only the owner may update a review.

Deletion is scoped to the authenticated user's ID.

Duplicate reviews are blocked by a database-level
unique constraint.

New reviews are restricted to anime whose canonical
catalog status is INCLUDED.

## Activity Integration

After successful review creation, the ReviewsService
calls ActivityEventService.

REVIEW_PUBLISHED generation is best-effort and requires
autoActivityEnabled to be true in UserSocialSettings.

Activity generation failure does not invalidate an
already-published review.

Review body and spoiler content are not copied
into the generated activity entry.

## Error Handling

Domain errors:
- ReviewValidationError
- ReviewConflictError
- ReviewForbiddenError
- ReviewNotFoundError

GraphQL extension codes:
- BAD_USER_INPUT
- CONFLICT
- FORBIDDEN
- NOT_FOUND

## Scope Boundaries

- No dedicated review likes or replies.
- No manga support.
- No streaming functionality.
- No automatic modification of tracking scores.
- No automatic modification of achievements.
- Spoiler concealment is a frontend responsibility.
- REVIEW_PUBLISHED events are not directly linked to
  review IDs in the current Activity schema.

## Verification

- 25 Reviews service tests passed.
- 12 Activities regression tests passed.
- GraphQL schema exposes 4 queries and 3 mutations.
- Public GraphQL smoke passed.
- Authenticated CRUD E2E passed.
- Duplicate review protection passed.
- Ownership and unauthenticated access checks passed.
- Aggregate statistics passed.
- Temporary test account was removed.

The opt-in REVIEW_PUBLISHED database side effect was
unit-level/integration-wiring checked, but was not
separately asserted in the authenticated CRUD E2E run.
