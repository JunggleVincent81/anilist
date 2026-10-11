# Notifications, Reporting, and Moderation

Recipient-owned notifications, deduplication, social event fanout, reporting limits, and moderation boundaries.

> Consolidated technical reference. Earlier milestone status lines are historical; current status is specified in the phase completion report.


---

## 123 Notifications

*Historical source: `AN-123-NOTIFICATIONS.md`.*

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


---

## 124 Reporting Moderation

*Historical source: `AN-124-REPORTING-MODERATION.md`.*

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


---

## 128 Notifications Frontend

*Historical source: `AN-128-NOTIFICATIONS-FRONTEND.md`.*

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
