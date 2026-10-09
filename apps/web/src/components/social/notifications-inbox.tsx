"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Bell, Check, CheckCheck, LoaderCircle, RefreshCw, Trash2 } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import {
  announceNotificationsUpdated,
  deleteMyNotification,
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationPage,
  type SocialNotification,
} from "@/lib/graphql/notifications"
import {
  displayUnreadCount,
  notificationHref,
  notificationMessage,
  type NotificationFilter,
} from "@/lib/graphql/notifications.contract"

function formatTime(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "Recently" : date.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

function NotificationRow({ item, pending, onRead, onDelete }: {
  item: SocialNotification
  pending: boolean
  onRead: (id: string) => void
  onDelete: (id: string) => void
}) {
  const actorName = item.actor.displayName || item.actor.username
  const destination = notificationHref(item.kind, item.actor.username)
  return (
    <li className={`rounded-xl border p-4 sm:p-5 ${item.isRead ? "border-border bg-surface" : "border-primary/25 bg-primary/5"}`}>
      <div className="flex items-start gap-3">
        <div aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
          {actorName.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-sm leading-6">
            <Link href={`/user/${encodeURIComponent(item.actor.username)}`} className="font-semibold hover:text-primary hover:underline">
              {actorName}
            </Link>{" "}{notificationMessage(item.kind)}.
            {!item.isRead ? <span className="ml-2 inline-block size-2 rounded-full bg-primary" aria-label="Unread" /> : null}
          </p>
          <p className="text-xs text-muted-foreground">{formatTime(item.createdAt)}</p>
          <Link href={destination} className="inline-block text-xs font-medium text-primary hover:underline">
            {item.kind === "FOLLOW" ? "View profile" : "Open activity feed"}
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {!item.isRead ? (
            <button type="button" onClick={() => onRead(item.id)} disabled={pending} title="Mark as read"
              aria-label={`Mark ${actorName}'s notification as read`}
              className="rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground disabled:opacity-50">
              <Check className="size-4" aria-hidden="true" />
            </button>
          ) : null}
          <button type="button" onClick={() => onDelete(item.id)} disabled={pending} title="Delete notification"
            aria-label={`Delete ${actorName}'s notification`}
            className="rounded-lg border border-border p-2 text-muted-foreground hover:text-destructive disabled:opacity-50">
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  )
}

export function NotificationsInbox() {
  const { user, status } = useAuth()
  const authenticated = status === "authenticated" && user !== null
  const [filter, setFilter] = useState<NotificationFilter>("all")
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [result, setResult] = useState<NotificationPage | null>(null)
  const [unreadCount, setUnreadCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(() => {
    setLoading(true)
    setReloadKey((key) => key + 1)
  }, [])

  useEffect(() => {
    if (!authenticated || !user?.id) return
    let cancelled = false
    const fetchData = async () => {
      try {
        const [inbox, count] = await Promise.all([
          fetchNotifications(page, filter === "unread"), fetchUnreadNotificationCount(),
        ])
        if (cancelled) return
        setResult(inbox)
        setUnreadCount(count)
        setError(null)
      } catch (cause) {
        if (cancelled) return
        setResult(null)
        setError(cause instanceof Error ? cause.message : "Could not load notifications.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void fetchData()
    return () => { cancelled = true }
  }, [authenticated, user?.id, page, filter, reloadKey])

  function selectFilter(next: NotificationFilter) {
    if (next === filter) return
    setFilter(next)
    setPage(1)
    setLoading(true)
    setError(null)
  }

  function changePage(next: number) {
    if (next < 1 || next === page) return
    setPage(next)
    setLoading(true)
  }

  async function runAction(key: string, operation: () => Promise<unknown>) {
    if (!authenticated || busyId !== null) return
    setBusyId(key)
    setError(null)
    try {
      await operation()
      announceNotificationsUpdated()
      setPage(1)
      refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Notification update failed.")
    } finally {
      setBusyId(null)
    }
  }

  if (status === "loading") {
    return <p role="status" className="rounded-xl border border-border bg-surface p-8 text-center text-muted-foreground">Checking your session…</p>
  }
  if (!authenticated) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <Bell aria-hidden="true" className="mx-auto size-9 text-primary" />
        <h2 className="mt-4 text-xl font-semibold">Sign in to view notifications</h2>
        <p className="mt-2 text-sm text-muted-foreground">Your notifications are private to your account.</p>
        <Link href="/login" className="mt-5 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Sign in</Link>
      </div>
    )
  }

  return (
    <section className="mx-auto max-w-3xl space-y-5 pb-16" aria-label="Notifications inbox">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Your social activity</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Notifications</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {unreadCount === null ? "Your latest activity alerts" : `${displayUnreadCount(unreadCount)} unread notification${unreadCount === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={refresh} disabled={loading || busyId !== null}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface disabled:opacity-50">
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" /> Refresh
          </button>
          <button type="button" onClick={() => { void runAction("all", markAllNotificationsRead) }}
            disabled={loading || busyId !== null || unreadCount === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {busyId === "all" ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <CheckCheck className="size-4" aria-hidden="true" />}
            Mark all read
          </button>
        </div>
      </div>
      <nav aria-label="Notification filter" className="flex gap-2 border-b border-border pb-3">
        {(["all", "unread"] as const).map((value) => (
          <button type="button" key={value} aria-pressed={filter === value} onClick={() => selectFilter(value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${filter === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface"}`}>
            {value === "all" ? "All" : "Unread"}
          </button>
        ))}
      </nav>
      {error ? <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{error}</p> : null}
      {loading ? (
        <p role="status" className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted-foreground">Loading notifications…</p>
      ) : result?.items.length ? (
        <>
          <ul className="space-y-3">
            {result.items.map((item) => (
              <NotificationRow key={item.id} item={item} pending={busyId !== null}
                onRead={(id) => { void runAction(id, async () => {
                  const found = await markNotificationRead(id)
                  if (!found) throw new Error("This notification is no longer available.")
                }) }}
                onDelete={(id) => { void runAction(id, async () => {
                  const deleted = await deleteMyNotification(id)
                  if (!deleted) throw new Error("This notification is no longer available.")
                }) }} />
            ))}
          </ul>
          <div className="flex items-center justify-between gap-4 pt-3 text-sm text-muted-foreground">
            <button type="button" disabled={!result.pageInfo.hasPreviousPage || busyId !== null} onClick={() => changePage(page - 1)}
              className="rounded-lg border border-border px-4 py-2 hover:bg-surface disabled:opacity-40">Previous</button>
            <span>Page {result.pageInfo.page} of {Math.max(1, result.pageInfo.pageCount)}</span>
            <button type="button" disabled={!result.pageInfo.hasNextPage || busyId !== null} onClick={() => changePage(page + 1)}
              className="rounded-lg border border-border px-4 py-2 hover:bg-surface disabled:opacity-40">Next</button>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-border bg-surface p-10 text-center text-sm text-muted-foreground">
          <Bell aria-hidden="true" className="mx-auto mb-3 size-8 opacity-60" />
          {filter === "unread" ? "You're all caught up!" : "No notifications yet. Follow and interact with other anime fans to get started."}
        </div>
      )}
    </section>
  )
}
