# AN-121 — Activity Likes & Replies

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
