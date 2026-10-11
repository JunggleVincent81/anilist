# Project Task Evidence Archive

Historical source documents preserved before AN-file consolidation.


---

## Source: `docs/04-anime-database/AN-051-DATA-SOURCE-STRATEGY.md`

SHA-256: `5f6756cbac7d7ed0c56ad3219a079bd70730483e1fb93783ff3d3f786ad3c83f`  
Original bytes: 504

````markdown
Canonical DB:
PostgreSQL owned by Anime Platform

Canonical ID:
Internal UUID

Bootstrap:
ODbL-compatible anime-offline-database

External providers:
stored only as mappings / provenance

AniList API:
prohibited for our use case

Jikan:
development/fallback only

AnimeSchedule:
not a canonical source

TMDB:
optional artwork enrichment

Manual edits:
highest precedence

Raw third-party payload:
do not persist by default

User tracking:
always points to internal Anime.id
````


---

## Source: `docs/10-social/AN-121-ACTIVITY-LIKES-AND-REPLIES.md`

SHA-256: `5c9ca72c155d539303c3d8a5ea0260bebe7955a93dafe200afe169190cf38ba3`  
Original bytes: 3564

````markdown
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
````


---

## Source: `docs/10-social/AN-122-ANIME-REVIEWS.md`

SHA-256: `7544454986c386a30bbba9130b0cc43abeae12c431b51bae8b4aa489f6f665ef`  
Original bytes: 3817

````markdown
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
````


---

## Source: `docs/10-social/AN-123-NOTIFICATIONS.md`

SHA-256: `2ab24b8bdaab5003e8ad9d0849ee8e1e124286dcb10be6dc511fa6e5c0244a2a`  
Original bytes: 1562

````markdown
# AN-123 — Social Notifications V1

Phase 10 — Social. Date: 2026-10-09.

In-app user-only notifications for NEW FOLLOW, ACTIVITY LIKE and ACTIVITY REPLY.
Canonical Prisma `Notification` references recipient and actor (cascade on user removal), optional activity (SetNull if activity removed), type, unique source ID, read flag and timestamp.
A unique `(recipientId, kind, sourceId)` index prevents duplicates. Self-notifications are skipped. Notifications contain no private review body or reply body.

GraphQL, authenticated only:
- `myNotifications(input: NotificationFeedInput)` — page/perPage (default 1/20, max 100), unreadOnly filter
- `myUnreadNotificationCount`
- `markNotificationRead(id: ID!)`
- `markAllNotificationsRead`
- `deleteMyNotification(id: ID!)`

Follow notifications are produced after a successful follow upsert, activity like after upsert, and reply after creation. Notification delivery is best effort; social actions still succeed if delivery fails. A repeated like/follow uses its existing sourceId and cannot produce a duplicate. Target activity references are nullable for activity deletion.

Non-goals: push/WebSocket delivery, batching, email, notification preference toggles, forum moderation, and frontend notification center. Existing autoActivityEnabled controls activity publishing, not these notifications. Privacy: recipient-only queries and mutations.

Verification: API tests, typecheck, lint, build, Prisma migration status, and GraphQL runtime smoke performed by the AN-123 delivery script before git checkpoint.
````


---

## Source: `docs/10-social/AN-124-REPORTING-MODERATION.md`

SHA-256: `2fa60129ee3591a801f83dfbb134bcbd71f7d15ccbd61e76b90ec4d7cd7cc189`  
Original bytes: 2277

````markdown
# AN-124 — User Reports & Moderation Queue V1

Date: 2026-10-09
Scope: Phase 10 — Social, Community & Production

## Reporting
- Any authenticated user may submit reports against PUBLIC or otherwise visible activities, anime reviews, and public user profiles.
- A user may not report their own content/profile.
- Allowed reasons: SPAM, HARASSMENT, HATE_SPEECH, SEXUAL_CONTENT, VIOLENCE, OTHER.
- Optional description: 500 characters maximum, trimmed.
- Duplicate reports against the same target by the same user are blocked by database uniqueness.
- Up to 20 new reports per user in a rolling 24-hour window.
- Reports reference targetType/targetId polymorphically; removed targets can leave a moderation record.
- Reports are not public. Each reporter can read only their own receipts without internal notes.

## Staff Triage
- Only MODERATOR or ADMIN can query the moderation queue or decide cases.
- Queue defaults to OPEN; supports status and pagination filters, 20/page default, 100/page maximum.
- OPEN -> RESOLVED or DISMISSED exactly once using an atomic status-scoped update.
- Decisions require a moderator note (10–500 characters, trimmed), reviewer identity, and timestamp.
- Moderators see reporter identity, but reporters never receive internal notes.
- Existing activity privacy settings are respected when users submit reports.
- No auto-deletion, account suspension, quarantine, or automated punitive decision in V1.

## GraphQL
Mutations:
- submitContentReport(input: SubmitContentReportInput!): ContentReportReceiptType!
- resolveContentReport(input: ResolveContentReportInput!): ModerationReportType! [MODERATOR, ADMIN]

Queries:
- myContentReports(input: ReportPageInput): MyContentReportsPageType! [authenticated]
- moderationReports(input: ModerationQueueInput): ModerationReportsPageType! [MODERATOR, ADMIN]

## Data
ContentReport: reporter, targetType, targetId, reason, details, status, reviewer, moderatorNote, timestamps.
Migration: add_content_reports; preserved existing user, review, activity and notification records.

## Follow-up
Case enforcement/takedown UI, appeals, moderation audit history, and staff workflow dashboard are separate future work. Staff must not treat RESOLVED alone as confirmation that reported content was removed.
````


---

## Source: `docs/10-social/AN-125-QUALITY-HARDENING.md`

SHA-256: `1a7fead0be94c7305f65a6b168a170421717bee1d8acd242987df1fb5ab0b463`  
Original bytes: 1667

````markdown
# AN-125 — API Quality Hardening

Date: 2026-10-09
Scope: Phase 10, backend request safeguards.

## Changes

- Apply a 128 KiB JSON and URL-encoded request body limit to Nest Express.
- Remove Express `X-Powered-By` exposure.
- Set `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy: no-referrer`, and `Cache-Control: no-store`.
- Add GraphQL validation budgets: 16 field nesting levels, 300 expanded
  field selections, 40 aliases per operation.
- Recursively expand fragment spreads, counting reuse for budget purposes.
- Reject malformed/abusive requests before GraphQL resolver execution.
- Retain existing CSRF prevention, production introspection restriction,
  session security, CORS allowlist, and global DTO validation.

## Compatibility

- Applies to all GraphQL queries and mutations; excessively deep or wide
  legitimate operations must be redesigned into smaller requests.
- Structural limits are not a substitute for a database query cost model.
- Request size limit does not replace per-field/domain validation.
- No changes to Prisma schema, migrations, or user data.

## Explicitly Deferred

- Distributed login-rate limiting and bot mitigation.
- Query-specific database execution timeouts and production load testing.
- Multi-node deployment, monitoring, backups, and reverse-proxy/TLS settings.

## Verification

Automated tests check normal requests, deep operations, aliases, wide
selections, and fragment expansion. Runtime smoke checks working GraphQL,
rejected abusive requests, HTTP 413 on oversized bodies, and security headers.
Full API regression, typecheck, lint, build, and migration status are required.
````


---

## Source: `docs/10-social/AN-126-PRODUCTION-READINESS.md`

SHA-256: `c36ba701bbbd1b2686d68d40c6d820400c4423a35167269c35920fb6dca2f230`  
Original bytes: 2837

````markdown
# AN-126 — Production Readiness Baseline

Status: Implementation completed; real production launch requires separate approval and checks.

## Delivered
- Production environment validation (HTTPS frontend origin; PostgreSQL URL)
- `API_PORT` / injected `PORT` compatibility
- HTTP `GET /health/live` (no dependency check)
- HTTP `GET /health/ready` (database ping, sanitized 503 on failure)
- `next start` uses Next.js default or platform-provided `PORT`
- Read-only smoke at `scripts/production-smoke.mjs`
- GitHub Actions CI with isolated PostgreSQL and full API/FE gates
- Local production-mode runtime verification with automatic process cleanup

## Environment
See `.env.production.example`. Store real credentials in host secret storage; never commit `.env` or credentials.
`NODE_ENV=production`; `WEB_URL` is exactly one HTTPS frontend origin (no path); `DATABASE_URL` is PostgreSQL; public API must terminate TLS at a trusted edge.
Configure `NEXT_PUBLIC_API_URL` during frontend build, not only at runtime.
`API_PORT` overrides the host-provided `PORT` when set. Remove local `API_PORT=4000` if platform mandates `PORT`.

## Deployment Runbook (platform-neutral)
1. Choose hosting and domains, configure managed PostgreSQL and encrypted backups.
2. Add protected environment variables in host settings. Configure HTTPS and allowed browser origin.
3. Run `pnpm install --frozen-lockfile`, Prisma generate, API/web builds in a trusted build environment.
4. **With approval and backup**, run `pnpm --filter @anime-platform/api exec prisma migrate deploy` against the actual target DB. Never use `prisma migrate dev` against production.
5. Start API: `pnpm --filter @anime-platform/api start`. Start web: `pnpm --filter @anime-platform/web start`.
6. Configure process restart, TLS, telemetry/alerts, dependency health checks, and rollback.
7. Check `/health/live`, `/health/ready`, and GraphQL from the production network using the smoke script.

```bash
API_PUBLIC_URL=https://api.example.com WEB_PUBLIC_URL=https://frontend.example.com SMOKE_CHECK_PRODUCTION=1 node scripts/production-smoke.mjs
```

The smoke script makes **read-only** requests. No user accounts or data are created. External availability, backups restoration, alert routing, credentials, DNS, and production performance are **NOT verified** by local passing tests.

## Safe Rollback
- Keep a tagged previous deploy artifact and a verified backup.
- Roll back application revision first if the DB schema is backward-compatible.
- For incompatible schema changes, plan forward-fix / restore with operator approval; do not automatically revert applied migrations.
- Verify health and critical user journeys after rollback.

## Release Boundary
AN-126 is engineering readiness work; it does not select a vendor, deploy live, or mark the site production-approved.
````


---

## Source: `docs/10-social/AN-127-FRONTEND-ACTIVITY-FEED.md`

SHA-256: `47e72dd82b76c1800c28ad0476ec864c6acfff21fc77cba4f54f7218c97fa183`  
Original bytes: 1295

````markdown
# AN-127 — Activity Feed Frontend V1

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
````


---

## Source: `docs/10-social/AN-128-NOTIFICATIONS-FRONTEND.md`

SHA-256: `5fb76613503bf60d4e4ee5a3c629b6a6921cffe994c65bbe6ed621b36c31c9ff`  
Original bytes: 1798

````markdown
# AN-128 — Notifications Frontend V1

## Scope

- Authenticated `/notifications` inbox, responsive desktop/mobile.
- `All`/`Unread` filter, server-side pagination (15 per page), count.
- Individual mark-as-read, mark-all-as-read, delete-own-notification; no optimistic mutation state or silent mutation failure.
- Linked header bell with unread badge (capped at 99+) and 60-second visible-tab refresh. Same-tab mutations dispatch a refresh event.
- Follow notification links to actor profile; likes/replies link to the activity feed. There is **no deep-linked activity detail page** in AN-128.
- Anonymous visitors receive a sign-in gate. Backend authorization remains the source of truth.

## Contracts

The frontend calls GraphQL AN-123: `myNotifications`, `myUnreadNotificationCount`, `markNotificationRead`, `markAllNotificationsRead`, `deleteMyNotification` via the credentialed shared GraphQL client. Mutations use variables, not string interpolation. All user-supplied data is escaped by React rendering.

## Known limitations

- No realtime websocket/push; count updates on focus, visibility change, mutations and roughly every minute in visible tabs.
- Two mounted responsive headers may make independent count requests; neither renders when hidden via its responsive CSS.
- No notification-specific activity permalink until a separate activity detail route is implemented.
- Browser-level authenticated UI journey is not covered by these Node contract tests. Test manually with two accounts before release.
- Deployment deferred by user. Database unchanged.

## Acceptance

Run full frontend and backend tests, typecheck, lint, build, read-only live GraphQL contract smoke, and migration status before making the scoped Git checkpoint. CI status must be verified separately after push.
````


---

## Source: `docs/10-social/AN-129-ANIME-REVIEWS-FRONTEND.md`

SHA-256: `fc35779be34e00b6febbe3136f5281707e9e2e8776afb379be212fc19819a0f5`  
Original bytes: 1641

````markdown
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
````


---

## Source: `docs/11-homepage/AN-130-HEADER-NAVIGATION.md`

SHA-256: `6853cde43b0ce85216c6d2fdff83b8e61c50df589111dfdf225d59900db6a4e2`  
Original bytes: 2189

````markdown
# Phase 11 — AN-130: Header and Navigation Restructure

Status: **LOCAL IMPLEMENTATION PENDING TEST ACCEPTANCE**
Baseline: main @ `7999820` (AN-129).

## Product intent
AniList is an anime information/tracking database with integrated social/community, **not an anime streaming service**. Keep the existing dark, clean, restrained visual system. Do not relabel the product publicly until naming/branding is approved by the owner. No new dependencies.

## Desktop navigation
- **Home** `/`, active only at `/`.
- **Anime** accessible dropdown: Browse Anime (`/discover`), Seasonal Anime (`/season`), Airing Schedule (`/schedule`). Anime routes including detail `/anime/[slug]` highlight this section.
- **Manga** and **Music** visible but inert/pending, no invented destinations; revisit when the respective domains have real pages.
- **Feed** `/feed` (new route) with active state.
- Preserve logo, search, notifications, account actions (profile, anime list, settings, logout), and keyboard focus behavior.

## Mobile navigation
- Five bottom actions: Home, Anime, Feed, My List, Profile/Sign in.
- Anime entry routes to existing anime discover page; Seasonal/Schedule accessible via mobile-header menu.
- Header preserves search and authenticated notifications bell.
- Future Manga/Music categories in header menu are explicitly disabled, not linked.

## Transition strategy
AN-130 makes `/feed` work as a route **before** changing `/`. Activity Feed remains rendered at `/` in this intermediate checkpoint, which is intentional. **AN-131 owns replacing `/` with the anime-first homepage and resolving any old navigation/notification paths that assumed `/` was the social feed.** Do not claim the Phase 11 homepage is complete after AN-130.

## Out of scope
No manga/music domain, no new anime ranking algorithms, no overhaul of styling, no database or GraphQL changes, no deployment, and no changes to existing account branding pending owner approval.

## Verification boundaries
Run frontend/backend tests, typecheck, lint, production builds, and Prisma migration status. Post-push confirm GitHub Actions. Responsive/manual browser walkthrough still required for true UX acceptance.
````


---

## Source: `docs/11-homepage/AN-131-FEED-MIGRATION.md`

SHA-256: `28fcc51b1d34002fdf972b67072b6091d1166e5a006fca62fb45717de713fd0c`  
Original bytes: 1829

````markdown
# Phase 11 — AN-131: Activity Feed Cutover

Status: **implemented; acceptance pending full verification**.
Baseline: `200f280` (AN-130).

## What changes
- `/feed` becomes the dedicated social-feed page and continues to render the original, unmodified `ActivityFeed` component with Everyone/Following, composer, like, reply, pagination and session gates.
- `/` becomes a minimal **anime-first transition homepage**, with direct real links to Browse Anime (`/discover`), Seasonal Anime (`/season`), Airing Schedule (`/schedule`), and social Feed (`/feed`). This transition is NOT the completed Phase 11 homepage.
- Follow notifications still link to actor profiles; activity-like and activity-reply notifications now link to `/feed` instead of `/`.
- AN-128 and AN-130 regression expectations have been migrated rather than disabled; additional AN-131 contract tests guard page separation.

## Visual and product constraints
Retain existing dark, clean, restrained style. This product is an anime information, tracking, and social platform, **not a video streaming site**. The transition homepage deliberately has no fabricated anime spotlight, popularity metric, episode releases, manga/music destinations, streaming CTAs, or placeholder data.

## Next steps, separate tasks
- AN-132: real Featured Anime Spotlight backed by verified catalog data.
- AN-133: real Current Season and Airing Today modules.
- AN-134–AN-136: ranking, community previews, music/manga previews only when backed by actual eligible sources.
- AN-137: final responsive/manual UX audit.

## Verification boundary
Automated web/API tests, typecheck, lint, production builds, and Prisma migrate status run before commit. Manual browser UX with logged-in users and remote GitHub Actions still require independent verification. No migration or deployment.
````


---

## Source: `docs/11-homepage/AN-132-COMPACT-ANIME-SPOTLIGHT.md`

SHA-256: `dcee2cd1085ed4739760f327adb1dbeb500b8e285f5d1baf5dd13be6cb2af434`  
Original bytes: 1650

````markdown
# AN-132 — Compact Featured Anime Spotlight

Phase 11: Anime-first homepage with integrated community.

- Replaces the AN-131 transition introduction with **one** compact, dark-themed, responsive spotlight.
- The Home page fetches its featured title from the **current Japanese anime season** via existing `animeDiscovery` and `animeBySlug` GraphQL clients. It requires `isAdult === false` from the detail result before displaying any title/poster.
- Selection is deterministic: first eight candidates from a `TITLE_ASC` page of 24, prioritizing `AIRING` and available HTTP(S) cover URLs. This is **not** a ranking or a recommendation based on popularity.
- Shows the actual title, format/status/episodes, optional genres, sanitized short description, and at most one cover.
- `View details` opens the existing anime detail page. `Manage list` goes to that detail page where the existing authenticated tracking control already operates. It does **not** add a list item merely by clicking.
- Handles GraphQL connection errors, empty seasons, missing details, and unavailable posters without inventing anime records.
- `force-dynamic` avoids a build-time dependency on a running API and allows season rollover on a new request. Existing `/feed` is preserved.
- No video playback, streaming CTA, soundtrack catalog, manga catalog, ranking statistics, backend changes, migrations, or deployment.

Manual acceptance after tests: visit `/` with and without a running GraphQL API; check responsive layout, text overflow, cover behavior, detail/list navigation, and `/feed`. Test with a non-adult seasonal catalog entry and inspect browser network/errors.
````


---

## Source: `docs/11-homepage/AN-133-CURRENT-SEASON-AIRING-TODAY.md`

SHA-256: `48424a34b060fad2ab5e46c4c6ca8aa1613b1e59f66c67d0cfc4fae116cb4878`  
Original bytes: 1481

````markdown
# AN-133 — Current Season & Airing Today

Phase 11: Anime-first Homepage & Integrated Community. Baseline: AN-132 / `7dc7210`.

## Content & UI

- Add one two-column desktop / one-column mobile section immediately after the existing compact spotlight; keep browse links and the community CTA.
- **Current Season**: current calendar season through existing `animeDiscovery`, four small poster cards maximum, linking to existing anime detail and season views.
- **Airing Today**: upcoming episode times from existing `airingSchedule(days:3)`; client shifts UTC server display to browser-local timezone after hydration; show at most four verified future entries matching the browser's calendar day.
- Unknown/adult anime are excluded: summary types carry no adult information. Each candidate requires detail `isAdult === false` and matching id/slug. Errors and empty states do not invent records.
- Selection is a bounded deterministic catalog preview, **not** a rating, popularity list, verified past episode release list, or recommendation engine.
- No streaming CTA/player or new manga/music domain. No migrations, server changes, dependencies, or deployment.

## Manual checks still required

Test with and without API running; verify current season items and time-zone-sensitive schedule with real records; check mobile overflow and disabled image fallback. Authenticated navigation remains in the original detail and Feed modules. CI remote status must be checked separately.
````


---

## Source: `docs/11-homepage/AN-134-COMMUNITY-RATING-IMPLEMENTATION.md`

SHA-256: `fe82f58c24c6d8e98701ecfc0420f965892f04e2d596c40840e0512cb63fed69`  
Original bytes: 1217

````markdown
# AN-134 — Community-rated anime (bounded subset)

Status: PATCH PREPARED — local tests, actual DB review counts, live GraphQL, browser QA and CI remain pending.

- This is an independently named **community-rated** chart, not the blocked external Top Anime metric or popularity/trending chart.
- Source: first-party `AnimeReview.score` (non-null, unique review per user/title).
- Restrict `Anime.catalogStatus=INCLUDED` and strictly `Anime.isAdult=false` in both aggregation and final title fetch. UNKNOWN excludes.
- Require at least three scored reviews per title; mean descending; count descending; anime ID ascending for deterministic ties. Top six only.
- Display both average (of 10) and scored review count. Empty/unavailable states do not fabricate data.
- No third-party poster rendering, age evidence promotion, schema migration, ranking based on external scores, or automatic catalog writes.
- AN-134 original external catalog ranking remains BLOCKED pending country and age evidence, provider score provenance, and a separately approved metric contract.
- Unit/integration tests for real DB aggregate shape, accessibility/browser walkthrough, CI and deployment still required before full acceptance.
````


---

## Source: `docs/11-homepage/AN-134-WEIGHTED-COMMUNITY-RANKING.md`

SHA-256: `8ce4105e2f6166f4275e300cf1ec6a0981896908a71adbd021187baf701cb5cc`  
Original bytes: 1165

````markdown
# AN-134-R2: Independent weighted community ranking

- Ratings source: local `AnimeReview.score` only. No external MAL/AniList scores, no official claim.
- Eligible anime: catalog `INCLUDED`, `isAdult = false`; missing age metadata is excluded.
- Minimum per title: 3 scored reviews, as before.
- Community mean C: mean of **all scored reviews belonging to eligible anime**.
- Weighted score: `(v * S + 10 * C) / (v + 10)` where `v` is scored-review count and `S` is the anime's raw mean. Weight 10 is a project policy choice, **not** claimed to be MAL's actual parameter.
- Sort weighted score descending, count descending, anime ID ascending; take 6 *after* weighting all eligible titles.
- Raw mean and weighted score both returned through GraphQL; homepage labels them separately.
- No data migration, seeding, popularity metric, external imports, or content rights changes.
- This is a small community-only ranking and will be empty until there are eligible user scores. Dedicated trending/popularity ranking remains separate future scope.
- Test gates: API and web tests, typecheck, lint, build, `git diff --check`, GraphQL runtime smoke, browser inspection.
````


---

## Source: `docs/11-homepage/AN-135-INTEGRATED-COMMUNITY.md`

SHA-256: `2b0bc3a561059f3aea7284f453374bd5f22c1874092843d91e31d54cd6a90e73`  
Original bytes: 1653

````markdown
# AN-135 — Integrated Community Pulse & Reviews

## Scope
- Home `/` includes compact **Community Pulse** (bounded public text updates) and **Community Reviews** (latest three confirmed non-adult, non-spoiler reviews), using real backend data and no fabricated statistics.
- Existing full activity feature remains at `/feed`; review composition/editing stays on anime detail pages.
- The public feed preserves users' activity visibility preferences. Homepage only displays text-only activity (never titles of unverified anime in the pulse).
- Review query: `recentPublicAnimeReviews` returns up to 3 reviews newest-first, where `isSpoiler=false`, `anime.catalogStatus=INCLUDED`, and `anime.isAdult=false`.
- `isAdult=null` is never treated as false. Since the AN-134A audits found 38,288 age flags UNKNOWN, this review preview may be empty until the provenance program is approved.
- Independent GraphQL requests and `Promise.allSettled` prevent either failure from breaking the whole Home.
- User-authored TEXT updates may contain unmarked spoilers; UI warns about this. Explicitly marked reviews are excluded. No guarantee about user mislabeling.
- No rating aggregation, global ranking, synthetic reviews, streaming UI, new DB schema, dependency, or deployment.

## Acceptance
- Backend review query filters before fetching; deterministic newest-first order and fixed cap.
- Home source remains server-rendered, responsive, accessible, with graceful empty/error states.
- Tests, TypeScript, lint, builds, Prisma status, exact-scope Git checkpoint only after PASS.
- GitHub Actions, live API and authenticated browser QA must be checked separately.
````


---

## Source: `docs/11-homepage/AN-136-COMPLETION-GATES.md`

SHA-256: `579f65f86e32e5cddd6979e7d3804075770aa7415ff07a22abd44bf9c4cc8791`  
Original bytes: 1746

````markdown
# AN-136 — Completion gates after foundation a8455fd

This patch provides `/manga` and `/music` server-rendered catalogue previews, data-source attributions, graceful empty/loading/error states, typed GraphQL client queries and frontend contract tests. It does **not** contain invented catalogue records, a publication workflow, or audio streaming. Navigation remains deliberately disabled until a real reviewed catalogue is published.

## Pending mandatory gates

1. **Database**: isolated migration replay against a disposable PostgreSQL database matching the target, SQL diff and schema verification, then **separate user approval** before modifying active DB. Do not run `migrate deploy`, `migrate dev`, `db push` or backfill without approval.
2. **Content**: supply real source-attributed manga and music records; verify rights and attribution, classification (adult unknown must remain hidden), identity uniqueness and human publication approval. No invented seed.
3. **Runtime**: after approved DB activation, test GraphQL `publicMangaPreview` and `publicAnimeMusicPreview` on actual API port (normally 4000). Verify `/manga` and `/music` on Next.js port 3000 in empty state and after approved publication. Build alone is not live acceptance.
4. **Security**: verify no mutation or admin route allows unpublished rows to appear; add authentication, editorial review, moderation, and audit trail before opening public editing or automatic publication.
5. **Phase 11 homepage**: do not enable Manga/Music primary nav until adequate reviewed data exists. Current frontend pages are accessible by their URLs, but not advertised as active primary modules.

Status: **Frontend prepared — acceptance conditional on operational gates above.**
````


---

## Source: `docs/11-homepage/AN-136-MANGA-MUSIC-DATA-GATE.md`

SHA-256: `0443072d00c622e3153e18725a63014c1e6e275482f89de71ef3720bb98bbd13`  
Original bytes: 982

````markdown
# AN-136 — Manga & Anime Music preview availability gate

**Decision: DEFERRED — no preview implemented.**

Phase 11 permits Manga and Anime Music previews **only when actual first-party catalog and API data exist**. Previous local read-only schema audits reported no dedicated Manga, Music, Theme or Artist tables. The existing Anime `MUSIC` enum value and `sourceMaterial = MANGA` do not provide opening/ending/OST catalog data or a separate manga database.

- No fabricated preview cards, sample counts, external images, routes, ratings or playback actions.
- Keep desktop Manga and Music future-category labels disabled per AN-130.
- Reassess only after dedicated domain model, data provenance, permissions, API and frontend routes are implemented and user-approved in later work.
- No schema, import, data or user-facing functionality changed by the AN-136 gate.

This is an explicit **deferral**, not feature completion. AN-134 catalog ranking remains blocked separately.
````


---

## Source: `docs/11-homepage/AN-136-MANGA-MUSIC-FOUNDATION-PREPARATION.md`

SHA-256: `c3562f0c59e3968e8b009c54f42708c8ffea3e8cc9de8ee26657ce1025c42c41`  
Original bytes: 1138

````markdown
# AN-136 — Independent Manga & Anime Music catalogue (prepared)

Status: **CODE PREPARED — MIGRATION NOT APPLIED — PUBLIC FEATURE NOT ACCEPTED**.

- Independent `MangaWork` and `AnimeMusicTrack` models, not Anime.sourceMaterial or Anime.format aliases.
- Strict public selection: manga published AND isAdult=false; linked music requires eligible Anime (`isAdult=false`, `INCLUDED`).
- All records default unpublished; no automatic import, seed, assets, audio, streaming or invented catalogue content.
- Source name/reference are required for future manual curation. `isPublished` must only be set after separate content/provenance approval.
- Two read-only GraphQL queries, each capped at twenty records.
- **Before database deployment:** independent migration SQL review, backup, isolated DB rehearsal, rollback rehearsal, explicit user approval. No migration is run by the package.
- **Still required for AN-136 completion:** curate real eligible records, approve publication gate, add/activate manga/music UI and navigation after data availability, authenticated and public runtime smoke tests, browser accessibility, remote CI.
````


---

## Source: `docs/11-homepage/AN-137-RESPONSIVE-POLISH.md`

SHA-256: `f679ef91c18fcb04733bf0a74fe33dd8d5995ee70f3cae196851d61bc91345a7`  
Original bytes: 1893

````markdown
# AN-137 — Responsive Homepage Polish & Final Local Quality Audit

## Scope

- Preserve dark minimal anime-first discovery and existing Home/Feed separation.
- Stream the live Featured, Current Season/Airing, and Community sections separately through server React Suspense boundaries with accessible loading placeholders; avoid fabricated anime and reviews.
- Improve minimum touch targets for existing homepage calls to action and section links, maintain keyboard focus states, add compact useful Home footer.
- Preserve AN-132/133 age checks, AN-135 backend spoiler/age filtering, and the AN-130 responsive navigation.
- Add targeted regression coverage and rerun full frontend/backend quality gates prior to any Git checkpoint.

## Out of scope

- No new GraphQL requests, migrations, backend changes or dependency installs.
- No Manga/Music preview before real catalog/API data exist (AN-136 deferred).
- No site-wide Top Rated / Popular / Trending ranking without approved metadata (AN-134 blocked).
- No claims of live GraphQL, browser, accessibility tooling or CI success without independent execution.

## Manual QA still required

- Start backend+frontend and verify Home/Feed navigation with and without login.
- At narrow mobile widths (~320 / 375 px), tablet (~768 px) and desktop (>=1024 px), confirm no horizontal scroll, visible links, readable card wrapping and non-overlapping nav.
- Test slow/unavailable GraphQL server, empty and successful data states; verify Suspense fallbacks are replaced rather than staying forever.
- Keyboard tab from Skip to content through homepage CTA/footer; test reduced-motion preference and touch target usability.
- Check episode times in a browser timezone, spoiler masking and non-adult filtering; never assume NULL is false.
- Review GitHub Actions on the pushed commit, and run live authenticated browser QA before deployment approval.
````


---

## Source: `docs/11-homepage/AN-139B2-SAFE-IMAGE-METADATA-FOUNDATION.md`

SHA-256: `4da52e48805e80af51e82944490b5f2684899cccc13002a735da0147289d52f1`  
Original bytes: 2079

````markdown
# AN-139B2 — Safe Image Metadata Foundation

Status: user-approved implementation; **not an artwork usage authorization**.

## Scope

- The offline import normalizer now recognizes `picture` and `thumbnail` as **candidate source metadata** in `NormalizedAnimeRecord.imageCandidates`.
- Each accepted candidate records `sourceDataset`, `sourceField`, `sourceHost`, and `sourceUrl`, together with immutable-at-normalization conservative values: `rightsStatus: UNVERIFIED`, `displayApproved: false`, `ageApproved: false`.
- HTTPS-only syntax; exact known dataset hostnames; no credentials/non-standard port/fragments; bounded URL length; known placeholder paths rejected. Sensitive-category path words are `riskHints` **only**, not age classifications.
- Known dataset hosts represent recognition of existing sources, **not permission for hotlinking, caching, proxying, or mirroring**.
- No external image HTTP requests, no migration, no image download, no database backfill, no `coverImageUrl` write, no public GraphQL fields or homepage changes.
- Existing `AnimeImportService` explicitly remains outside this change and does not consume or persist `imageCandidates`. Re-running imports is NOT part of AN-139B2.

## Boundary & follow-up

The candidate list is transient normalized source metadata; it is **not persisted** and thus does not itself create a curated asset database. Future persistence should have explicit source/rights evidence, user approval, revocation, and display-mode guards. Studio/distributor licensed art or manually curated, verified assets are alternatives to unlicensed syndicated posters.

AN-139B3 requires a separate copyright and hotlink gate plus scoped user approval. AN-139C requires age/origin evidence. Do not assign `isAdult=false` from URLs or URLs from age policy. The homepage may legitimately remain empty until those gates are resolved.

The proposed future first-party catalog authoring/editor workflow for manually supplied anime posters and synopses is **out of scope**, including any user submissions, upload infrastructure, or CMS.
````


---

## Source: `docs/11-homepage/AN-139C2-ELIGIBILITY-POLICY.md`

SHA-256: `29ec219e0cf0bdb0c52af65b08af4977ea79ac62aa46c2f825a1d6773ec70054`  
Original bytes: 4501

````markdown
# AN-139C2 — Catalog Age & Origin Evidence Governance

**Status:** APPROVED POLICY DIRECTION; IMPLEMENTED AS NON-PUBLISHING DRAFT VALIDATOR.

**Baseline:** `86844a6` · **No schema, SQL writes, import, public display or age unlock.**

## Scope and principles

Anime scope remains *Japanese anime, Chinese donghua and Korean aeni*, including verifiable co-productions. Movies, TV, OVA, ONA and Specials are each reviewed on their own merits. `Anime.catalogStatus=INCLUDED` alone does not establish age suitability, origin or artwork rights. Age, production country and image permission are **independent** decisions.

**A valid evidence URL, an official-looking page, credit to a studio, broadcast time, language, genres, audience marketing or absence of warnings never automatically verifies a classification.** Source evidence must refer to the exact release/edition/season/cour. Do not import a rating from an earlier season, 1994 adaptation or another territory.

## Approved evidence tracks

1. **OFFICIAL_CLASSIFICATION**: name the actual classification authority or distributor/platform, **jurisdiction**, exact release/edition, classification symbol, scheme/version, original evidence URL, capture date, reviewer and review date. No global conversion table or inferred age threshold has been approved yet. A label from one jurisdiction cannot be automatically treated as an Indonesian content rating.
2. **EDITORIAL_REVIEW**: may be used when a release-specific official rating is unavailable. Record exact release/edition, explicit content observations and categories (violence, sexual content, nudity, etc.), direct traceable source(s), rationale and **two independent reviewers** with timestamps. Editorial judgement must be labeled editorial, never official. Reviewers may propose NON_ADULT/ADULT/UNRESOLVED but the proposal does not approve publication.

`AWAITING_APPROVAL` means a document's **required fields appear filled**, not that its factual claims, source authority, production identity, age outcome or public suitability have been independently verified. `INCOMPLETE` means required fields are absent/invalid. Both leave public eligibility **denied**.

## Separate country/production review

- Record all evidenced production-country codes (including co-productions), release identity, primary-production/committee role analysis, links, reviewer and date. Japanese studio headquarters or a Japanese TV channel alone cannot establish all countries.
- The software draft validator can flag incomplete origin evidence; it **does not validate historical production facts**. A supervisor must approve and reconcile countries against source claims before persistence. Records that are not verifiably JP/CN/KR-related remain pending regardless of age findings.
- Manga, anime music and poster licenses remain separate gates.

## Explicit security and decision boundaries

- The pure function `assessCatalogEligibilityEvidenceDraft()` checks document completeness only; it always returns `publicDisplayApproved:false`, `approvedIsAdult:null`, `approvedCountryCodes:[]`.
- No GraphQL resolver, UI editor, authorization, reviewer identity proof, DB schema, migration, backfill or publishing integration is created under AN-139C2. It does not change homepage age filters.
- Current 12 pilot titles remain **UNKNOWN**; no auto conversion of `isAdult=NULL` into `false`. No artwork is approved.
- The exact official-rating-to-eligibility mapping, editorial rubric thresholds, admin roles/signoff, dispute process, evidence retention, audit log, expiration/revocation and reversible schema updates require **future separate design and user approval**.
- Only after such approval: proposed review states `DRAFT → UNDER_REVIEW → APPROVED/REJECTED → REVOKED`; preserve manual overrides, implement atomic audited DB changes, dual-check exceptional cases, and run browser QA.

## Future editor/database project

A future admin catalog editor may curate licensed posters and manually written/authorized synopses alongside title metadata and age/origin evidence. Uploading a poster yourself does not establish copyright permission. **That UI and the database schema are out of scope here.**

## Verification

Run focused Jest against `src/anime-catalog/catalog-eligibility-evidence-policy.spec.ts`, full web/API tests, typecheck, lint and builds, and Prisma migration status. AN-139C2 is complete when its code and documentation checkpoint passes; **the 12 pilot records remain unapproved**.
````


---

## Source: `docs/12-admin-catalog/AN-140A-ARCHITECTURE-LOCK.md`

SHA-256: `2aacf8353cc5d64a6a2cc3e4971cdb4ed618be3d1a46cbfb857cbc8060f72856`  
Original bytes: 1387

````markdown
# AN-140A — Admin Catalog Curation Architecture Lock

Status: **APPROVED AS BASELINE** — user continuation after blueprint review (2026-10-09).

- Retain `Anime` as the canonical UUID-identified record; retain external identity links and user relationships.
- Admin-only for the initial future interface. Existing MODERATOR role does not inherit catalog privileges.
- Private draft -> submitted -> review -> separately approved publication. No automatic age or artwork eligibility.
- Official classification and two-independent-person editorial review remain distinct, with separate production-country evidence.
- Original Indonesian synopsis editing is prioritized after protected read-only admin views; copyright review required for non-original text.
- Unapproved source URLs are not public assets; staging should use private storage when authorized later.
- Importer precedence, role assignment, provider/storage selection, publication rules and production deployment are later gates.

This lock authorizes an **additive schema preparation**. It does NOT authorize executing migration SQL against the development/production database, changing `isAdult`, backfilling assets, or writing canonical Anime fields.

Blueprint location at review time: `AN-140-ADMIN-CATALOG-CURATION-BLUEPRINT.md` (external review artifact). The blueprint's pending implementation gates remain binding.
````


---

## Source: `docs/12-admin-catalog/AN-140B-ADDITIVE-SCHEMA-PREPARATION.md`

SHA-256: `ab2dfe0064a46432d82244823472d88c75157acee45c5b0c04bb6e1ae9d693b6`  
Original bytes: 2364

````markdown
# AN-140B — Additive Curation Schema Preparation

Status: **PREPARED; NOT DATABASE-APPLIED**.

## Additive persistence

- `CatalogChangeRequest`: Anime UUID, creator, field-specific proposal JSON, base Anime timestamp and optimistic draft revision.
- `CatalogEvidence`: evidence references and source provenance, separate from verification sign-off.
- `CatalogReviewDecision`: identified reviewer, policy version, track, draft revision, human decision; uniqueness stops duplicate same-track same-version signatures.
- `CatalogAsset`: private staging key, cryptographic hash, license references, storage delivery mode and revocation state; no automatic public URLs.
- `CatalogRevision`: future approved field snapshots for rollback and audit provenance.
- `CatalogProductionCountry`: origin candidates attached to request/evidence, not published country assertions.

Relations to existing Anime/User are additive **Prisma relation fields only**; no existing database columns, IDs, or tracking tables change. Foreign keys use `RESTRICT` to protect curation history against parent hard deletion. The proposed JSON patches and evidence URLs must later undergo strict service-level validation and MUST NOT be used to fetch arbitrary remote URLs.

## Approval and deployment gates

1. Review SQL at `apps/api/prisma/migrations/20261009180000_an140b_catalog_curation_foundation/migration.sql`.
2. Backup relevant data before any migration approval; rehearse schema on a dedicated isolated PostgreSQL test database and perform rollback rehearsal there.
3. Confirm no drift and expected baseline migration count (18) before applying; there will be **19 migration files**, with AN-140B deliberately pending on the local development DB.
4. Request explicit user approval for a *separate* migration application script. Do not manually run `prisma migrate dev/deploy/db push` yet.
5. After database application, independently test row integrity/counts, migration status, permission boundaries and failure recovery.
6. AN-140C read-only admin authorization and admin UI are separate work items; no GraphQL/resolver/routes here.

Rollback strategy: keep the schema/migration in Git until formally accepted; if cancelled before applying, use a scoped revert commit. If applied, do not drop curation tables on a live database without a separate backup, data audit, and approval.
````


---

## Source: `docs/12-admin-catalog/AN-140C-READ-ONLY-ADMIN-DASHBOARD.md`

SHA-256: `f58e34f68b9269cecb651b093673e9c163236f0c6a38a5a9209413a753a1ecf2`  
Original bytes: 1965

````markdown
# AN-140C — Protected Admin Catalog Dashboard

Status: implementation milestone; verify quality logs and Git checkpoint before marking delivered.

## Authorized surface

- `adminCatalogOverview` and `adminCatalogPage` are GraphQL queries protected by the existing `RolesGuard` with `@Roles(UserRole.ADMIN)` on **each** resolver method. MODERATOR and USER are not delegated access. Server-side checks are authoritative; the browser role check is user experience only.
- New `/admin/catalog` page uses the existing authenticated GraphQL client (`credentials: include`) and current user context. Anonymous and non-ADMIN sessions do not send catalog queries and see appropriate denied states.
- Overview reports catalog status, missing canonical synopsis, missing canonical cover field, age unverified, and private change-request count. These counts are **not** approvals or rights verification.
- Listing supports bounded server-side pagination, title/slug search, catalog status, age flag. All statuses including REVIEW and EXCLUDED are visible exclusively to ADMIN.
- No raw image URLs are output into the new UI; a present `coverImageUrl` is *not* a rights approval. Excerpts of canonical synopsis are limited to 220 characters.
- No schema changes, migrations, mutations, age backfill, publishing actions, external URL fetches, storage writes or auto role assignments.

## Security and verification

- Unit tests check strict ADMIN decorator and guard metadata, bounded query input, and read-only Prisma methods.
- AN-140B development migration was previously verified by user: 19 migrations, six tables, 9 enums, 16 foreign keys, 38,288 pre-existing Anime rows intact.
- Browser, real admin-session GraphQL E2E, and moderator-denial live tests should be performed separately. The script only runs automated tests/builds; do not claim live tests from static gates.
- No account is granted ADMIN by this feature; role assignment remains a separate approval gate.
````


---

## Source: `docs/12-admin-catalog/AN-142-PRIVATE-SYNOPSIS-DRAFT-FOUNDATION.md`

SHA-256: `5624fe001d0043a3f3fb0f5afaf02a5dbf89d06539d9d540f8a5c9686418dd1f`  
Original bytes: 975

````markdown
# AN-142 — Private Synopsis Draft Foundation

Status: LOCAL QUALITY GATES PASSED; live E2E and remote CI pending.

Scope: ADMIN-only GraphQL create/read/update for original synopsis proposals in existing `CatalogChangeRequest` model. Create records with `SYNOPSIS` and `DRAFT`, bind to actor and Anime baseline timestamp. Update uses conditional `updateMany` revision increment and owner/state guards. No new migration, canonical Anime update, submission/review/approval, public frontend publication, image usage, age changes, or role assignment. Only draft owner reads/edits their private drafts. ADMIN role does not permit editing another ADMIN's draft.

Contract: `createAdminSynopsisDraft(input)`, `adminSynopsisDraft(draftId)`, and `updateAdminSynopsisDraft(input)`.

Important: This backend foundation does not include an editor UI. Browser QA, real ADMIN/MODERATOR E2E, and CI still need independent verification. Do not mark Phase 12 complete from this checkpoint.
````


---

## Source: `docs/12-admin-catalog/AN-143-PRIVATE-SYNOPSIS-EDITOR.md`

SHA-256: `6a6672542f18a199ede2a53b102086da5693e0321f34bda2ac2898d35d282f16`  
Original bytes: 869

````markdown
# AN-143 — Private Synopsis Editor UI

Status: PATCH PREPARED — local verification pending.

- New administrator-only `/admin/catalog/synopsis?animeId=<uuid>` UI links from the existing read-only catalog list.
- Uses AN-142 authenticated GraphQL mutations and ownership-restricted draft lookup; saves explicit expectedRevision.
- Draft IDs are visible to the author; reopening requires the draft ID, which is not authorization by itself.
- Server RolesGuard remains authoritative; UI also gates anonymous and non-ADMIN users.
- No migrations, canonical Anime update, publication, classification edit, asset usage, external fetch, or role assignment.
- Verify API/web quality gates, GraphQL live authenticated authorization and browser accessibility independently.
- Known limitation: no first-party listing of drafts; save the displayed draft ID to resume editing.
````


---

## Source: `docs/12-admin-catalog/AN-144-PRIVATE-SYNOPSIS-SUBMISSION-REVIEW.md`

SHA-256: `b1f888f77c47c0c65fe068e98e8f83caae40ff5c0013548c0a656f96d4c5a8c0`  
Original bytes: 815

````markdown
# AN-144 — Private synopsis submission & restricted review

Status: PATCH PREPARED; local quality gates and live authenticated E2E pending.

- ADMIN-only `submitAdminSynopsisDraft`, owner/revision-checked `DRAFT` -> `SUBMITTED`.
- ADMIN-only `reviewAdminSynopsisSubmission`: independent reviewer, `SUBMITTED`/`UNDER_REVIEW` -> `DRAFT` (`REQUEST_CHANGES`) or `REJECTED` (`REJECT`).
- Review state CAS and immutable `CatalogReviewDecision` creation in the same database transaction.
- `APPROVE`, canonical Anime writes, `isAdult`, external image fetching, publication, and migrations are deliberately excluded.
- Review queue/UI, live ADMIN/MODERATOR authentication and DB integration testing remain separate acceptance work.
- Returning a request to DRAFT retains ownership and permits creator edits under AN-142.
````


---

## Source: `docs/12-admin-catalog/AN-145-PRIVATE-SYNOPSIS-REVIEW-UI.md`

SHA-256: `dd6361efe6200d9b0d93d79057b8d322f8b6b3ef4aee91b90d398f0b3730bb8d`  
Original bytes: 894

````markdown
# AN-145 — Private Synopsis Review Workflow UI

Status: PATCH PREPARED — local quality gates, live admin-auth E2E, and database integration pending.

- Adds an ADMIN-only paged GraphQL review queue for submitted synopsis proposals, without raw asset URLs.
- Adds review queue UI and entry link from protected admin catalog. Creator's own submissions cannot be reviewed (server also enforces).
- Connects existing saved draft editor to the AN-144 submit mutation with an expected revision. Only saved text may be submitted.
- Review actions are REQUEST_CHANGES / REJECT, with required human rationale. APPROVE and publication remain unavailable.
- All queues are private; no canonical Anime mutation, role assignment, age change, migration, external requests, or public route.
- Query caps per-page to 20 and upper-bounds page number to 10000. Policy acceptance and full E2E still required.
````


---

## Source: `docs/99-reports/AN-121-COMPLETION-REPORT.md`

SHA-256: `63579519f2997e0d26d885899647569d8164cd395aed9114bed0d72d3f4dd110`  
Original bytes: 1456

````markdown
# AN-121 Completion Report

## Task

AN-121 — Activity Likes & Replies

## Result

COMPLETE

## Delivered

- ActivityLike Prisma domain
- ActivityReply Prisma domain
- unique like enforcement
- reply non-empty database constraint
- cascade deletion rules
- privacy-aware activity interaction service
- like/unlike GraphQL mutations
- reply query and pagination
- create/delete reply mutations
- activity like/reply counts
- legacy-user PUBLIC visibility compatibility
- focused interaction tests
- runtime GraphQL interaction smoke

## Migration

`20261008103232_add_activity_likes_and_replies`

The migration creates:

- `ActivityLike`
- `ActivityReply`
- required indexes
- foreign keys
- unique activity/user like index
- `ActivityReply_body_nonempty`

## Privacy

Activity interaction access follows the owner's current activity visibility:

- PUBLIC
- FOLLOWERS
- PRIVATE

Missing social settings are interpreted as PUBLIC.

## Runtime Validation

A temporary authenticated user was used to exercise:

`create activity -> like -> duplicate like -> reply -> inspect counts -> inspect replies -> unlike -> delete reply -> inspect final counts`

Observed counts:

- initial: `0 / 0`
- after interaction: `1 / 1`
- after cleanup: `0 / 0`

Duplicate like remained idempotent.

## Excluded

Not part of AN-121:

- nested discussion threads
- reviews
- notifications
- reports
- blocking
- moderation

## Next Task

AN-122 — Reviews Domain & GraphQL API
````


---

## Source: `docs/99-reports/AN-122-COMPLETION-REPORT.md`

SHA-256: `162011200506d502665c132f8752465427c852f7908cd2109de265d086ddc27a`  
Original bytes: 2301

````markdown
# AN-122 Completion Report

Date: 2026-10-09
Phase: 10 — Social
Feature: Anime Reviews

## Delivery

Implemented:
- Prisma AnimeReview model
- PostgreSQL migration and integrity constraints
- ReviewsService
- ReviewsResolver
- ReviewsModule
- GraphQL DTOs and response types
- Review validation and authorization
- Review pagination
- Aggregate review statistics
- REVIEW_PUBLISHED activity integration
- Reviews service regression tests

## Migration Verification

16 Prisma migrations synchronized.

Verified:
- Database foreign keys
- Primary key
- Unique user/anime index
- Pagination indexes
- Body CHECK constraint
- Title CHECK constraint
- Score CHECK constraint

## Automated Tests

ReviewsService:
25 passed, 0 failed.

Activities regression:
12 passed, 0 failed.

Total focused tests:
37 passed.

Static verification:
- TypeScript typecheck passed
- ESLint passed
- NestJS build passed

## Runtime GraphQL Verification

NestJS application bootstrapped successfully.

GraphQL schema:
- 4 review queries available
- 3 review mutations available

Public GraphQL smoke: PASS.

Authenticated CRUD E2E:
- Database connection: PASS
- Unauthenticated mutation rejection: PASS
- Account registration: PASS
- Login with cookies: PASS
- Review creation: PASS
- Duplicate review rejection: PASS
- Single review read: PASS
- Anime review feed: PASS
- User review feed: PASS
- Review update: PASS
- Aggregate statistics: PASS
- Review deletion: PASS
- Statistics restoration: PASS
- Test account cleanup: PASS

Final E2E result:
AN-122 AUTHENTICATED CRUD: PASS

## Runtime Issue Resolved

NestJS GraphQL initially rejected nullable union
property reflection.

Fixed with explicit GraphQL @Field type callbacks.

Application subsequently started successfully.

## Verification Boundary

The authenticated E2E exercised CRUD and aggregate
statistics. It did not explicitly enable automatic
social activity and query the resulting
REVIEW_PUBLISHED row.

## Database Safety

The authenticated E2E operated against an existing
INCLUDED anime without modifying anime catalog data.

The temporary review was deleted and its temporary
user account was removed.

## Delivery Status

Core Anime Reviews backend: COMPLETE.

Frontend presentation and any additional future
social refinements remain separate work.
````


---

## Source: `docs/99-reports/AN-123-COMPLETION-REPORT.md`

SHA-256: `8e679af595d822f7f6b586a4fd2e537363fe6b929e2f25a966f36083df4c3dc0`  
Original bytes: 1078

````markdown
# AN-123 Completion Report

Date: 2026-10-09
Feature: Social Notifications V1
Status: COMPLETE after successful automated delivery script.

Scope: Prisma model, migration, GraphQL read/unread/mark/delete, recipient isolation, follow+like+reply event hooks, idempotent delivery, self-notification suppression, best-effort failure isolation and unit regression tests.

Validation: full API Jest suite, typecheck, lint, build, migration status, live GraphQL introspection with unauthorized read denial, and authenticated follow/like/reply notification E2E with cleanup.

Boundaries: in-app only; frontend UI and delivery channels later. No changes to anime catalog or existing reviews domain.

## Final recovery validation

Fixed `NotificationFeedInput` validation metadata for NestJS global
ValidationPipe (`IsOptional`, integer/range checks, boolean filter).
Validation was rechecked with focused DTO regression tests and the complete
API Jest suite, typecheck, lint, build, current Prisma migration status,
GraphQL runtime schema/auth smoke, and authenticated notification E2E.
````


---

## Source: `docs/99-reports/AN-124-COMPLETION-REPORT.md`

SHA-256: `46e811c5928bd71b860bcee170c52f1c8e1943b6673bf6e55c78f3257bad0291`  
Original bytes: 1454

````markdown
# AN-124 Completion Report

Date: 2026-10-09
Feature: User Reports & Moderation Queue V1
Commit baseline: bf4504c — AN-123

Delivered:
- Prisma content report schema, unique constraint, indexed queue and non-destructive migration.
- GraphQL report creation, own-report feed, moderator queue, moderator decision.
- Role-guarded MODERATOR/ADMIN-only operations.
- Status-based atomic triage and auditable moderator decision.
- Validation, per-user volume limiting, duplicate prevention, report privacy.
- Unit tests and DTO validation regression tests.

Acceptance gates executed by accompanying AN-124 install script:
- Full API Jest test suite.
- TypeScript typecheck, ESLint, build.
- Prisma migration status.
- Live GraphQL bootstrap + authorization and authenticated E2E with temporary users.
- Temporary test-user cleanup.

Boundary: triage statuses do not hide/remove content. No automated content enforcement in AN-124.

## Recovery and Final Verification
- Mock argument typing corrected in moderation.service.spec.ts (test-only change).
- Complete API test suite: PASS (required before checkpoint).
- API typecheck, lint, build: PASS.
- Prisma migration status: PASS.
- Live NestJS GraphQL schema and auth guards: PASS.
- Authenticated E2E: report, duplicate protection, own inbox, staff-only queue,
  atomic resolution, permissions, and test-account cleanup: PASS.
- Local commits and remote push occur only after all mandatory gates succeed.
````


---

## Source: `docs/99-reports/AN-125-COMPLETION-REPORT.md`

SHA-256: `9d2dd396d7f23e427181a12b1b7d5c80025c1684a36e82881e3d07b5ca6d41ab`  
Original bytes: 822

````markdown
# AN-125 — Completion Report

Date: 2026-10-09
Target: Quality hardening of public API entrypoints.

## Delivered

- HTTP parser body limit and response headers.
- GraphQL structural budget validation rule.
- Focused attack/compatibility regression tests.
- Automated local runtime probes using an isolated temporary TCP port.

## Acceptance Gates

- API complete Jest suite, TypeScript, ESLint, NestJS build: required.
- Existing Prisma migrations remain synchronized; no new migration.
- GraphQL normal query and complexity rejection: required.
- Oversized HTTP body rejection and security headers: required.
- Git stage scope, commit and push: only after all checks pass.

## Remaining Risk

Rate limiting, database execution cost budgets, load tests and live
production observability are not delivered by this task.
````


---

## Source: `docs/99-reports/AN-126-COMPLETION-REPORT.md`

SHA-256: `21e90bbcbc9808609eaeebf3879d4bfa031c93ec9d74b1856b802099ba359393`  
Original bytes: 854

````markdown
# AN-126 Completion Report

Date: 2026-10-09
Scope: Production readiness foundation

## Implemented
- Production config fail-closed guards
- Port portability for API and web startup
- Liveness and sanitized database readiness endpoints
- Read-only live API deployment smoke script
- Isolated production-mode local verification
- GitHub Actions isolated Postgres CI pipeline
- Platform-neutral deployment, backups, rollback instructions

## Acceptance gates
- Full API test suite: PASS
- API typecheck/lint/build: PASS
- Prisma migrate status: PASS
- Frontend test/typecheck/lint/build: PASS
- Production-mode HTTP + GraphQL runtime smoke: PASS
- GitHub Actions first remote execution: NOT YET VERIFIED
- Real deployment, TLS, backup restore and alerting: NOT YET VERIFIED

No production deployment or production database writes were performed in AN-126.
````


---

## Source: `docs/99-reports/AN-127-COMPLETION-REPORT.md`

SHA-256: `675194dea12500070ac4ffb6a87bd48973b873927d890981766d1161efcd0077`  
Original bytes: 287

````markdown
# AN-127 — Implementation Report

Status: LOCAL ACCEPTANCE PASSED — Remote CI pending

Changes: home-page social feed, GraphQL query/mutation adapter, validation, node:test regression suite, anonymous GraphQL smoke check.

No schema migrations, deployment, or test-account creation.
````


---

## Source: `docs/99-reports/AN-128-COMPLETION-REPORT.md`

SHA-256: `8058a4ebd5cc191f5b9658819d2345a01921f4b4eedc6b538b5b9b2da05ac2fa`  
Original bytes: 1093

````markdown
# AN-128 — Completion Report

Status: **LOCAL COMPLETE — remote CI not yet verified**.

## Scope delivered

- Credentialed notifications API client and typed GraphQL operations.
- Authenticated `/notifications` inbox: All / Unread, pagination, mark read, mark all read, delete, refresh, loading/error/empty/sign-in states.
- Shared desktop and mobile header bell, unread badge and refreshing count.
- 9 notification contract tests + existing AN-127 frontend tests and full backend suite.

## Local acceptance

- Frontend tests, TypeScript, ESLint, Next.js production build: PASS.
- Backend tests, TypeScript, ESLint, NestJS build: PASS.
- Read-only live GraphQL operations contract and anonymous access denial: PASS.
- Prisma migration status: PASS. No migration created or applied.
- No production deployment performed.

## Remaining before release

Verify GitHub Actions on the pushed commit. Test in a browser with two real non-production accounts to confirm follow/like/reply notifications and navigation, and handle absence of a deep-linked activity detail route in a follow-up task.
````


---

## Source: `docs/99-reports/AN-129-COMPLETION-REPORT.md`

SHA-256: `a0262d4afef32d1bd8af9c4d06b17bb2bb95a35b635659ffcd948b97bd98f024`  
Original bytes: 853

````markdown
# AN-129 — Completion Report

Status: **LOCAL COMPLETE — remote CI and browser walkthrough pending**.

- Reviews displayed within anime detail; public pagination and aggregate stats, spoiler conceal/reveal, credentialed create/edit/delete and sign-in gating.
- Full web and API automated tests, typecheck, lint, production builds: PASS.
- Live read-only GraphQL review queries/stats: PASS; anonymous create/update/delete denied: PASS.
- Prisma migration status: PASS; database unchanged.
- React effect depends on a stable authenticated username, avoiding an unstable user-object dependency.
- No production deployment performed.

## Post-push follow-up

Confirm GitHub Actions green. Perform authenticated browser testing with two non-production accounts, including own review management and spoiler disclosure, before declaring release readiness.
````


---

## Source: `docs/99-reports/AN-130-COMPLETION-REPORT.md`

SHA-256: `df9673bed03ae3ab7abc50e97a8e3c8e39ab9b2b772c192aac1636af3d49c9db`  
Original bytes: 1063

````markdown
# AN-130 — Completion Report

**LOCAL IMPLEMENTATION: PASS** — verify GitHub Actions and manual browser UX separately.

- Phase: 11 — Anime-first Homepage and Integrated Community.
- Baseline: `7999820` (AN-129).
- Desktop header: Home, Anime dropdown (Browse/Seasonal/Schedule), Manga/Music inert, Feed.
- Mobile header: search, bell, Anime sections/future pending dropdown.
- Mobile bottom navigation: Home, Anime, Feed, My List, Profile/Sign in.
- `/feed` route working; `/` still renders Activity Feed on purpose until AN-131.
- All frontend and API automated tests, static typecheck, zero-warning ESLint, production builds: **PASS**.
- Prisma migration status: **PASS**; no migration added.
- Database untouched; deployment not performed.

## Follow-up
1. Confirm GitHub Actions job green after push.
2. Perform keyboard and mobile browser checks (menu dropdown, focus, active states, login/no login, five bottom items).
3. **AN-131**: replace `/` content with anime-first home and update old links (`notificationHref` etc.) that assumed `/` was Feed.
````


---

## Source: `docs/99-reports/AN-131-COMPLETION-REPORT.md`

SHA-256: `7e2eab49ed7e56cf68c3194f2fdafa6f1785700b337efb13be53fd1b55e65731`  
Original bytes: 1172

````markdown
# AN-131 — Completion Report

**LOCAL IMPLEMENTATION: PASS**, after full local verification. GitHub Actions and interactive browser checks remain pending separately.

- Phase: 11 — Anime-first Homepage and Integrated Community.
- Baseline: `200f280` (AN-130).
- `/` is now an anime-first discovery navigation landing; no `ActivityFeed` rendered there.
- `/feed` retains original Activity Feed composer, Everyone/Following filters, likes, replies, pagination and login gates.
- Social like/reply notifications now link to `/feed`; follow notifications continue linking to actor profiles.
- AN-128 / AN-130 legacy tests corrected and AN-131 migration regression tests added.
- Frontend tests, typecheck, lint, Next production build: PASS.
- Backend tests, typecheck, lint, Nest production build: PASS.
- Prisma migration status: PASS; no migrations added, database untouched.
- No new dependency or deployment.

## Boundaries
The homepage is an intentional **intermediate** screen. Anime spotlight, live seasonal/airing cards, rankings and integrated community summaries remain in AN-132 through AN-136. Manual browser and remote CI checks must be confirmed separately.
````


---

## Source: `docs/99-reports/AN-132-COMPLETION-REPORT.md`

SHA-256: `7ce5a80dfce31beee6ceede016c717ca4b9d1505325be1d50e4ac4e9a93dea27`  
Original bytes: 794

````markdown
# AN-132 Completion Report (Local)

Baseline: `c9b426f` (AN-131). Scope: server-rendered compact seasonal spotlight on `/`.

Files: `apps/web/src/app/page.tsx`, `apps/web/src/components/home/featured-anime-spotlight.tsx`, `apps/web/src/lib/home/spotlight-policy.ts`, focused AN-132 tests and AN-131 compatibility tests, this report and feature specification.

Design: dark, minimal, one poster maximum; no streaming UI. Real GraphQL discovery and detail data; explicit adult filtering; transparent deterministic selection; error/empty-state fallback.

Final quality gates are executed by the delivery script before commit. Live authenticated browser UX, remote CI, and deployment are **not** claimed by this report; check separately. AN-133 will handle Current Season and Airing Today modules.
````


---

## Source: `docs/99-reports/AN-133-COMPLETION-REPORT.md`

SHA-256: `a0cf71ea3732e2444e0ee6301af6af111fd1a93bc329f0ecfd814e215cbc86c9`  
Original bytes: 653

````markdown
# AN-133 — Local Completion Report

Baseline: `7dc7210` (AN-132). Phase: 11. Scope: current season + today airing on Home, existing GraphQL clients only.

Source files: `apps/web/src/app/page.tsx`, `apps/web/src/lib/home/seasonal-airing-policy.ts`, `apps/web/src/components/home/home-season-airing.tsx`, `apps/web/src/components/home/today-airing-list.tsx`; `apps/web/test/home-season-airing.test.mjs` provides AN-133 checks.

Local test/build/lint/typecheck/Prisma quality gates run at the END of the AN-133 shell delivery. Git commit only if every gate passes. Browser manual and remote CI verification pending. No database migration or deployment.
````


---

## Source: `docs/99-reports/AN-135-COMPLETION-REPORT.md`

SHA-256: `90484dada26426ed6addc37577b3f60b33a6d4894d97321278a44058e7f6c11c`  
Original bytes: 894

````markdown
# AN-135 Completion Report

- Scope: bounded public activity pulse and spoiler-tag-excluding, age-verified review preview on Home.
- Baseline: `52516e4` (AN-134 held; AN-134A1–A6 were read-only).
- Expected scope: homepage; community preview component + policy + GraphQL client; 3 existing frontend test adjustments (AN-131, AN-132, AN-133) + new tests; ReviewsService/Resolver + one backend regression test; documentation.
- Data integrity: `isAdult = null` is not eligible. Review body isn't fetched for tagged spoilers by the homepage GraphQL query. Unmarked user spoilers can still occur.
- No database write, migration, dependency additions, import, change to feed route, or deployment.
- Acceptance: final quality gates and git checkpoint must pass in the local execution log.
- Follow-up: remote CI and browser checks; AN-134 evidence enrichment and scoring require separate approval.
````


---

## Source: `docs/99-reports/AN-137-LOCAL-AUDIT-REPORT.md`

SHA-256: `51c353815ba9593959b236b2bcc09136dc964fb26e23d4135515fa20293f230c`  
Original bytes: 949

````markdown
# AN-137 — Local execution and remaining Phase 11 gates

Status: **IMPLEMENTED SUBJECT TO SCRIPT QUALITY GATES** (the running script executes all gates before committing).

- Base: AN-135 `f610093`. No deployment or database changes.
- AN-137: Homepage streaming loading states, touch/keyboard polish and footer; scoped static regression tests.
- AN-136: DEFERRED (missing independent Manga/Anime Music data models and catalog APIs).
- AN-134: BLOCKED (country/age evidence, external catalog score provenance and metric contract not yet approved).
- GitHub remote CI: NOT VERIFIED.
- Live GraphQL integration: NOT VERIFIED.
- Authenticated and anonymous manual browser QA: PENDING.
- Automated accessibility audit: NOT RUN.
- manual browser QA: PENDING.
- remote CI: NOT VERIFIED.
- deployment: DEFERRED.

**Phase 11 is not fully complete** even if this AN-137 local quality checkpoint passes. Final launch is subject to separate review/approval.
````


---

## Source: `docs/99-reports/AN-139B2-COMPLETION-REPORT.md`

SHA-256: `7bf66492ade647b7ca716994f100388b1a35c1a74d3a629284e856986c2b33fd`  
Original bytes: 894

````markdown
# AN-139B2 — Local Completion Report

Implementation checkpoint from baseline `553291d`, awaiting local script verification and Git checkpoint.

Changes: pure image candidate parsing and validation, normalized record metadata, Jest regression tests, documentation.

Required local verification (the script fails before commit if any check fails):

- Focused Jest image candidate and normalizer tests
- Full frontend/backend tests; typecheck; lint; builds
- Prisma migration status (no migration created)
- Exact source/commit scope, clean Git checkpoint + push

Hard safety boundaries: image rights gate **HOLD** (0 approved), age gate **UNKNOWN**, no DB backfill, no importer persistence, no anime cover display, no external requests and no auto-import.

Remote CI, manual authenticated browser QA, and rights-holder permissions are independent and **not certified by a local script pass**.
````


---

## Source: `docs/99-reports/AN-139C2-COMPLETION-REPORT.md`

SHA-256: `7b8fab9f37f7500fcc18ad0afccbe2257c9b42902fac612eaae545ba07a606f2`  
Original bytes: 1029

````markdown
# AN-139C2 — Evidence Policy Foundation Completion Record

- Baseline: `86844a6` (AN-139B2 completed).
- Purpose: encode approved official-classification and two-reviewer editorial **documentation gates**, plus a separate origin evidence gate.
- Added: `apps/api/src/anime-catalog/catalog-eligibility-evidence-policy.ts` and Jest regression tests.
- No changes to production API, `Anime` schema, `isAdult`, importer persistence, homepage, asset rights, 12 pilot records or existing catalog decisions.
- Both completeness tracks can return `AWAITING_APPROVAL` only; output always denies publication and DB-field approval.
- Final status: set by the script's local test/build/Git checkpoint only. Passing local quality checks does NOT represent legal, ratings-authority or country verification, production availability, live browser QA or remote CI.
- Future approval gates: rating policy thresholds, manual QA workflow/roles, DB provenance/migration and reversible publication, and separately licensed artwork/synopsis editing.
````


---

## Source: `docs/99-reports/AN-140B-PREPARATION-REPORT.md`

SHA-256: `4e5c80e1268340ab1d0f841a6a1562c5b2cbaa6d9e1537c4ccfb699de14a29da`  
Original bytes: 750

````markdown
# AN-140B — Prepared Schema Checkpoint

- Base repository HEAD: `77ff128`.
- Action: prepared six additive private curation models and nine supporting enums, migration SQL, contract regression tests, and AN-140A architecture lock.
- Intentionally NO migration application to any database; no canonical Anime or User columns touched.
- No API/UI/rights approval, no image URL publication, no `isAdult` updates, no role bootstrap, no importer modifications.
- Local code tests/build/Prisma schema validation performed by the implementation script before Git checkpoint.
- **Acceptance label: schema prepared, database deployment PENDING user approval and isolated DB rehearsal.**
- Manual browser and remote CI have not been verified by this script.
````


---

## Source: `docs/99-reports/AN-140C-COMPLETION-REPORT.md`

SHA-256: `9330306ed72f47a3b30982e0fcfc96d1aae7040657564687bf927cc6b105cbbe`  
Original bytes: 763

````markdown
# AN-140C Completion Report

- Baseline: `72d1fbe` — AN-140B migration already applied to local development DB.
- Implemented: ADMIN-only read-only GraphQL overview and paged catalog listing, bounded filters; protected `/admin/catalog` frontend; ADMIN desktop profile-menu navigation.
- Security: `RolesGuard` + `@Roles(UserRole.ADMIN)` on each query; no mutation, image render, external fetch, or role assignment.
- Verified in implementation script: full API Jest tests, API typecheck/lint/build, web tests/typecheck/lint/build; exact-scope Git diff checked before commit.
- Not performed automatically: actual-browser interaction, live authenticated ADMIN/MODERATOR E2E and production deployments.
- Data write scope: none. AN-140B schema/records untouched.
````


---

## Source: `docs/99-reports/AN-146-COMPLETION-REPORT.md`

SHA-256: `90542f9d48b3f0beedfb65c4b6a6e5a74d5aa766ce51ce0c3786bb65e3fac887`  
Original bytes: 1923

````markdown
# AN-146 — Security and Browser E2E Completion Report

Status: ACCEPTANCE PASSED
Checkpoint baseline: 07437ee

## Scope

- Browser E2E using Playwright and local Google Chrome.
- Anonymous admin access protection.
- Authenticated USER, MODERATOR, and ADMIN authorization.
- Expired and revoked session rejection.
- Isolated PostgreSQL migration and integration verification.

## Verification Evidence

| Gate | Result |
|---|---|
| Browser E2E | 5/5 PASS |
| Web unit regression | 68/68 PASS |
| API authorization regression | 17/17 PASS |
| Web TypeScript | PASS |
| Web ESLint | PASS |
| PostgreSQL 16 isolated migrations | 20/20 PASS |
| Authenticated GraphQL role matrix | 6/6 PASS |
| Test fixture cleanup | 0 User, 0 Session |
| Test API port cleanup | Port 4001 released |

## Authorization Matrix

| Identity | Expected and observed |
|---|---|
| Anonymous | UNAUTHENTICATED |
| USER | FORBIDDEN |
| MODERATOR | FORBIDDEN |
| ADMIN | Authorized |
| Expired admin session | UNAUTHENTICATED |
| Revoked admin session | UNAUTHENTICATED |

## Isolation

- Test container: an146-postgres-test
- Test database: an146_security_test
- Test DB endpoint: 127.0.0.1:55436
- Test API endpoint: 127.0.0.1:4001
- No development or production database migration performed by AN-146.
- Disposable PostgreSQL container intentionally retained pending cleanup approval.

## Implementation

- apps/web/playwright.config.mjs
- apps/web/e2e/an146-public.spec.mjs
- apps/api/scripts/an146-role-matrix.mjs

## Limitations

- Tests cover the specified admin authorization and public navigation flows,
  not every feature or mutation of the platform.
- Production deployment and remote browser environments are not certified
  by this local acceptance run.
- Publication approval and catalog asset governance remain separate gates.

## Conclusion

AN-146 scoped security and browser acceptance gates passed.
Proceed to AN-147 final audit.
````


---

## Source: `docs/99-reports/AN-147-FINAL-PHASE-11-12-AUDIT.md`

SHA-256: `9b6bf26a28f57c08c1d1378c1994c79175ce73235ce882919572e979990b539c`  
Original bytes: 4743

````markdown
# AN-147 — Final Phase 11/12 Audit

Status: LOCAL AUDIT PASSED WITH DOCUMENTED DEFERRED GATES
Baseline commit: 1995482

## 1. Scope

Consolidated audit of:

- Phase 11 anime-first homepage and community integration.
- Phase 12 private admin catalog and synopsis workflows.
- Manga/Music technical foundations.
- Runtime, database migration, security and browser acceptance evidence.
- Outstanding content, publication and governance requirements.

This report does not authorize publication, new migrations,
production deployment or new feature implementation.

## 2. Phase 11 — Homepage

| Component | Assessment |
|---|---|
| Anime-first homepage | COMPLETE — scoped implementation |
| Home/Feed separation | COMPLETE |
| Desktop/mobile navigation | COMPLETE |
| Featured Anime spotlight | COMPLETE — eligibility-gated |
| Current Season / Airing Today | COMPLETE — eligibility-gated |
| Community Pulse / Reviews | COMPLETE — spoiler-safe preview |
| Weighted community ranking | COMPLETE — internal metric |
| External official ranking | DEFERRED — separate metric approval |
| Manga/Music API and pages | FOUNDATION COMPLETE |
| Manga/Music curated public content | DEFERRED |

The community ranking is based on this platform's scored reviews.
It is not an official ranking from MAL, AniList or another provider.

## 3. Phase 12 — Admin Catalog

| Component | Assessment |
|---|---|
| Additive catalog schema foundation | COMPLETE — development DB applied |
| Read-only admin catalog dashboard | COMPLETE — scoped |
| Private synopsis draft | COMPLETE — scoped |
| Private synopsis editor | COMPLETE — scoped |
| Synopsis submission and review | COMPLETE — scoped |
| Private review queue UI | COMPLETE — scoped |
| Synopsis approval and canonical publication | DEFERRED |
| Public poster/background asset publication | DEFERRED |
| Full editorial publication workflow | DEFERRED |

Review currently supports REQUEST_CHANGES and REJECT.
Approval and public canonical mutations remain deliberately gated.

## 4. Database Findings

Development database: anime_platform
Observed anime records: 38288
Observed MangaWork records: 0
Observed AnimeMusicTrack records: 0
Observed CatalogChangeRequest records: 0

Confirmed applied development migrations:

- 20261009180000_an140b_catalog_curation_foundation
- 20261009235000_an136_manga_music_foundation

Some historical preparation documents still describe these migrations
as pending. Their statements reflect earlier checkpoints and do not
override the database history verified during AN-147.

## 5. Runtime Acceptance

API /health/ready: PASS
GraphQL communityRankedAnime: PASS (empty data)
GraphQL publicMangaPreview: PASS (empty data)
GraphQL publicAnimeMusicPreview: PASS (empty data)

HTTP 200:
- /
- /feed
- /manga
- /music
- /admin/catalog

HTTP 200 for the admin page does not establish authorization.
Admin access boundaries were tested separately in AN-146.

## 6. AN-146 Security Evidence

- Playwright Chrome E2E: 5/5 PASS.
- API authorization regression: 17/17 PASS.
- Web regression tests: 68/68 PASS.
- Isolated PostgreSQL migrations: 20/20 PASS.
- Live GraphQL role matrix: 6/6 PASS.
- Test fixtures: 0 User and 0 Session after cleanup.
- API test port 4001 released.
- Browser and security checkpoints: 07437ee, 1995482.

These are local acceptance results, not production certification.

## 7. Unresolved Gates

1. Manga/Music publication needs real curated records,
   traceable provenance and content eligibility approval.
2. Synopsis canonical publication requires separate approval,
   editorial policy, conflict handling and audit requirements.
3. Poster/background usage requires rights assessment,
   source attribution and publication approval.
4. External rankings require a separately approved metric
   contract and sufficiently reliable metadata.
5. Production deployment and remote browser verification
   are not established by this local audit.

These are deferred decisions, not silently completed features.

## 8. Repository Hygiene

- Baseline: main synchronized with origin/main at 1995482.
- Local test logs and Playwright artifacts are excluded.
- Next.js generated next-env.d.ts path changes are not part
  of this audit deliverable.
- Disposable an146-postgres-test container is retained
  pending separate cleanup approval.

## 9. Final Assessment

Phase 11 scoped technical implementation: COMPLETE.
Phase 12 scoped private admin implementation: COMPLETE.
Manga/Music technical foundation: COMPLETE.
Publication/content/editorial workflows: DEFERRED.

AN-147 local audit: PASSED WITH DEFERRED GATES.

No authorization is granted to publish catalog content,
enable synopsis approval, import assets or deploy production.
````
