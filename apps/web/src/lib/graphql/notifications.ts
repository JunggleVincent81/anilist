import { graphqlRequest } from "@/lib/graphql/client"
import {
  DELETE_MY_NOTIFICATION_MUTATION,
  MARK_ALL_NOTIFICATIONS_READ_MUTATION,
  MARK_NOTIFICATION_READ_MUTATION,
  MY_NOTIFICATIONS_QUERY,
  MY_UNREAD_NOTIFICATION_COUNT_QUERY,
  NOTIFICATION_PAGE_SIZE,
  normalizeNotificationPage,
  type NotificationKind,
} from "./notifications.contract"

export type SocialNotification = {
  id: string
  kind: NotificationKind
  sourceId: string
  targetActivityId: string | null
  isRead: boolean
  createdAt: string
  actor: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
}
export type NotificationPage = {
  items: SocialNotification[]
  pageInfo: {
    page: number
    perPage: number
    total: number
    pageCount: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export async function fetchNotifications(page: number, unreadOnly: boolean): Promise<NotificationPage> {
  const result = await graphqlRequest<
    { myNotifications: NotificationPage },
    { input: { page: number; perPage: number; unreadOnly: boolean } }
  >(MY_NOTIFICATIONS_QUERY, {
    input: { page: normalizeNotificationPage(page), perPage: NOTIFICATION_PAGE_SIZE, unreadOnly },
  })
  return result.myNotifications
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const result = await graphqlRequest<{ myUnreadNotificationCount: number }>(MY_UNREAD_NOTIFICATION_COUNT_QUERY)
  return result.myUnreadNotificationCount
}

export async function markNotificationRead(id: string): Promise<boolean> {
  const result = await graphqlRequest<{ markNotificationRead: boolean }, { id: string }>(MARK_NOTIFICATION_READ_MUTATION, { id })
  return result.markNotificationRead
}

export async function markAllNotificationsRead(): Promise<number> {
  const result = await graphqlRequest<{ markAllNotificationsRead: number }>(MARK_ALL_NOTIFICATIONS_READ_MUTATION)
  return result.markAllNotificationsRead
}

export async function deleteMyNotification(id: string): Promise<boolean> {
  const result = await graphqlRequest<{ deleteMyNotification: boolean }, { id: string }>(DELETE_MY_NOTIFICATION_MUTATION, { id })
  return result.deleteMyNotification
}

export const NOTIFICATIONS_UPDATED_EVENT = "anilist:notifications-updated"
export function announceNotificationsUpdated(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT))
}
