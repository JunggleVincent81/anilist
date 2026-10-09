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
