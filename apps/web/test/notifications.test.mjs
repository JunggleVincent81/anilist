import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import {
  NOTIFICATION_PAGE_SIZE, MY_NOTIFICATIONS_QUERY, MY_UNREAD_NOTIFICATION_COUNT_QUERY,
  MARK_NOTIFICATION_READ_MUTATION, MARK_ALL_NOTIFICATIONS_READ_MUTATION,
  DELETE_MY_NOTIFICATION_MUTATION, displayUnreadCount, notificationHref,
  notificationMessage, normalizeNotificationPage,
} from "../src/lib/graphql/notifications.contract.ts"

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8")

test("pagination inputs are bounded and finite", () => {
  assert.ok(NOTIFICATION_PAGE_SIZE >= 1 && NOTIFICATION_PAGE_SIZE <= 100)
  for (const invalid of [-1, 0, 2.5, NaN, Infinity]) assert.equal(normalizeNotificationPage(invalid), 1)
  assert.equal(normalizeNotificationPage(3), 3)
})
test("unread badge caps large counts and ignores invalid values", () => {
  assert.equal(displayUnreadCount(0), "0")
  assert.equal(displayUnreadCount(1), "1")
  assert.equal(displayUnreadCount(99), "99")
  assert.equal(displayUnreadCount(100), "99+")
  assert.equal(displayUnreadCount(-3), "0")
})
test("notification text is derived from supported types, not untrusted HTML", () => {
  assert.match(notificationMessage("FOLLOW"), /follow/)
  assert.match(notificationMessage("ACTIVITY_LIKE"), /liked/)
  assert.match(notificationMessage("ACTIVITY_REPLY"), /replied/)
})
test("follow notifications navigate to encoded profiles; activity navigates to feed", () => {
  assert.equal(notificationHref("FOLLOW", "user name"), "/user/user%20name")
  assert.equal(notificationHref("ACTIVITY_REPLY", "tester"), "/feed")
  assert.equal(notificationHref("ACTIVITY_LIKE", "tester"), "/feed")
})
test("notifications query uses server pagination/filter input and typed actor fields", () => {
  assert.match(MY_NOTIFICATIONS_QUERY, /myNotifications\s*\(input:\s*\$input\)/)
  assert.match(MY_NOTIFICATIONS_QUERY, /NotificationFeedInput/)
  assert.match(MY_NOTIFICATIONS_QUERY, /targetActivityId/)
  assert.match(MY_NOTIFICATIONS_QUERY, /actor\s*\{\s*id username displayName avatarUrl/)
  assert.match(MY_UNREAD_NOTIFICATION_COUNT_QUERY, /myUnreadNotificationCount/)
})
test("mutations use GraphQL variables for ids and correct backend entry points", () => {
  assert.match(MARK_NOTIFICATION_READ_MUTATION, /markNotificationRead\s*\(id:\s*\$id\)/)
  assert.match(MARK_ALL_NOTIFICATIONS_READ_MUTATION, /markAllNotificationsRead/)
  assert.match(DELETE_MY_NOTIFICATION_MUTATION, /deleteMyNotification\s*\(id:\s*\$id\)/)
})
test("GraphQL client uses a single shared authenticated request transport", () => {
  const code = read("../src/lib/graphql/notifications.ts")
  assert.match(code, /graphqlRequest/)
  assert.match(code, /unreadOnly/)
  assert.match(code, /NOTIFICATION_PAGE_SIZE/)
  assert.match(code, /NOTIFICATIONS_UPDATED_EVENT/)
  assert.doesNotMatch(code, /fetch\s*\(\s*["']http/)
})
test("both header bells are real links; no placeholder button remains", () => {
  const bell = read("../src/components/social/notifications-bell.tsx")
  assert.match(bell, /href="\/notifications"/)
  assert.match(bell, /fetchUnreadNotificationCount/)
  assert.match(bell, /60_000/)
  for (const name of ["desktop-header.tsx", "mobile-header.tsx"]) {
    const code = read(`../src/components/layout/${name}`)
    assert.match(code, /<NotificationsBell\s*\/>/)
    assert.doesNotMatch(code, /aria-label="Notifications"/)
  }
})
test("inbox supports filters, read, read-all, delete, loading and anonymous gate", () => {
  const code = read("../src/components/social/notifications-inbox.tsx")
  for (const word of ["markNotificationRead", "markAllNotificationsRead", "deleteMyNotification", "Sign in", "Loading notifications", "unread", "announceNotificationsUpdated"]) {
    assert.ok(code.includes(word), `${word} missing`)
  }
  assert.match(code, /aria-pressed=\{filter === value\}/)
})
