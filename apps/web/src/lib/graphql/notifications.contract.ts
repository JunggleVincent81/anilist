/** AN-128: GraphQL operations and pure presentation policy for notifications. */
export const NOTIFICATION_PAGE_SIZE = 15
export const NOTIFICATION_COUNT_CAP = 99
export type NotificationFilter = "all" | "unread"
export type NotificationKind = "FOLLOW" | "ACTIVITY_LIKE" | "ACTIVITY_REPLY"

export function normalizeNotificationPage(value: number): number {
  return Number.isSafeInteger(value) && value > 0 ? value : 1
}

export function displayUnreadCount(value: number): string {
  if (!Number.isSafeInteger(value) || value < 0) return "0"
  return value > NOTIFICATION_COUNT_CAP ? `${NOTIFICATION_COUNT_CAP}+` : String(value)
}

export function notificationMessage(kind: NotificationKind): string {
  switch (kind) {
    case "FOLLOW": return "started following you"
    case "ACTIVITY_LIKE": return "liked your activity"
    case "ACTIVITY_REPLY": return "replied to your activity"
    default: return "interacted with you"
  }
}

export function notificationHref(kind: NotificationKind, username: string): string {
  return kind === "FOLLOW" ? `/user/${encodeURIComponent(username)}` : "/feed"
}

export const MY_NOTIFICATIONS_QUERY = `
  query MyNotifications($input: NotificationFeedInput) {
    myNotifications(input: $input) {
      items {
        id kind sourceId targetActivityId isRead createdAt
        actor { id username displayName avatarUrl }
      }
      pageInfo { page perPage total pageCount hasNextPage hasPreviousPage }
    }
  }
`

export const MY_UNREAD_NOTIFICATION_COUNT_QUERY = `
  query MyUnreadNotificationCount { myUnreadNotificationCount }
`

export const MARK_NOTIFICATION_READ_MUTATION = `
  mutation MarkNotificationRead($id: ID!) { markNotificationRead(id: $id) }
`

export const MARK_ALL_NOTIFICATIONS_READ_MUTATION = `
  mutation MarkAllNotificationsRead { markAllNotificationsRead }
`

export const DELETE_MY_NOTIFICATION_MUTATION = `
  mutation DeleteMyNotification($id: ID!) { deleteMyNotification(id: $id) }
`
