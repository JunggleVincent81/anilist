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
