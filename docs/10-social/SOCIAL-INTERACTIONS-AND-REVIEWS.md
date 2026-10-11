# Social Interactions and Anime Reviews

Activity interaction, the public feed, and anime-specific reviews are secondary to anime tracking; authorization, one-review-per-user constraints, and spoiler control apply.

> Consolidated technical reference. Earlier milestone status lines are historical; current status is specified in the phase completion report.


---

## 121 Activity Likes And Replies

*Historical source: `AN-121-ACTIVITY-LIKES-AND-REPLIES.md`.*

Status: COMPLETE

## Scope

AN-121 extends the Phase 10 social activity domain with lightweight interactions:

- activity likes
- activity replies
- like and reply counts
- privacy-aware interaction authorization
- paginated replies
- owner-scoped reply deletion

The feature remains secondary to anime tracking and does not introduce forum-style threading.

## Database Domain

### ActivityLike

A directed interaction between one user and one activity.

Rules:

- one like per user per activity
- deleting the user removes the like
- deleting the activity removes the like
- repeated like requests are idempotent

Unique key:

`(activityId, userId)`

Indexes:

- `(activityId, createdAt)`
- `(userId, createdAt)`

### ActivityReply

A one-level reply attached directly to an activity.

Fields:

- id
- activityId
- userId
- body
- createdAt

Rules:

- body maximum length: 500 characters
- whitespace-only replies are rejected
- no parent reply relation exists
- replies are not nested
- deleting the user removes the reply
- deleting the activity removes the reply

Database constraint:

`ActivityReply_body_nonempty`

## GraphQL API

### Mutations

`likeActivity(activityId: ID!): Boolean!`

Creates an idempotent like for the authenticated user.

`unlikeActivity(activityId: ID!): Boolean!`

Removes the authenticated user's like.

`createActivityReply(activityId: ID!, input: CreateActivityReplyInput!): ActivityReplyType!`

Creates a trimmed one-level reply.

`deleteMyActivityReply(replyId: ID!): Boolean!`

Deletes a reply only when it belongs to the authenticated user.

### Queries

`activityReplies(activityId: ID!, input: ActivityFeedInput): ActivityReplyPageType`

Returns replies ordered by:

1. createdAt ascending
2. id ascending

Pagination uses page/perPage semantics consistent with the activity feed.

## Activity Counts

Activity GraphQL objects expose:

- `likeCount`
- `replyCount`

Counts are returned from Prisma relation counts.

## Privacy Policy

Interaction visibility follows the parent activity owner's current activity visibility.

### PUBLIC

Visible and interactable by everyone.

### FOLLOWERS

Visible and interactable by:

- the activity owner
- users following the activity owner

### PRIVATE

Visible and interactable only by the activity owner.

Users without a `UserSocialSettings` row are treated as:

`activityVisibility = PUBLIC`

This preserves the logical default for accounts created before explicit social settings exist.

## Removal Policy

Unlike and delete-own-reply operations are ownership scoped and do not require current visibility.

This allows a user to withdraw their own interaction even if the activity owner later changes privacy settings.

## Non-Goals

AN-121 does not implement:

- nested replies
- forum threads
- reply-to-reply relationships
- notifications
- blocking
- reporting
- moderation
- reviews

Those belong to later Phase 10 tasks.

## Validation

Validated through:

- Prisma schema validation
- migration application
- PostgreSQL constraint inspection
- PostgreSQL unique-index inspection
- focused interaction service tests
- activity regression tests
- TypeScript typecheck
- ESLint
- NestJS build
- GraphQL runtime smoke

Runtime smoke validated:

1. authenticated text activity creation
2. initial `likeCount = 0`
3. initial `replyCount = 0`
4. repeated like remains idempotent
5. reply body is trimmed
6. counts become `1 / 1`
7. reply pagination returns one item
8. unlike succeeds
9. reply deletion succeeds
10. counts return to `0 / 0`


---

## 122 Anime Reviews

*Historical source: `AN-122-ANIME-REVIEWS.md`.*

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


---

## 127 Frontend Activity Feed

*Historical source: `AN-127-FRONTEND-ACTIVITY-FEED.md`.*

Status: Local implementation and verification complete; remote CI pending.

## Scope

- Home (`/`) now shows the social activity feed in the existing application shell.
- Public feed available anonymously; Following feed requires a session.
- Authenticated members can create text posts (1–500 characters after trim).
- Like/unlike and first page of replies with authenticated reply composer.
- Pagination, loading, empty, failure and retry states.
- Existing GraphQL credentialed client is reused; no auth bypass or new dependency.

## Known V1 limitations

- Like selection is tracked for the current page session only: API feed items do not expose `viewerHasLiked`. Counts are reloaded after mutation; subsequent sessions initially display the neutral Like state.
- Replies initially show the first 20 only; dedicated per-activity reply pagination is a later enhancement.
- Notifications, reviews, moderation and profile-feed UI are follow-up frontend integrations.
- Production deployment is explicitly deferred.

## Validation

`pnpm --filter @anime-platform/web test`, `typecheck`, `lint`, `build`;
`pnpm --filter @anime-platform/api test`, `typecheck`, `build`;
`python scripts/verify-activity-feed-contract.py` (read-only on an ephemeral port).


---

## 129 Anime Reviews Frontend

*Historical source: `AN-129-ANIME-REVIEWS-FRONTEND.md`.*

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
