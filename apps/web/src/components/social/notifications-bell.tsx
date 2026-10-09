"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { BellIcon } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  fetchUnreadNotificationCount,
  NOTIFICATIONS_UPDATED_EVENT,
} from "@/lib/graphql/notifications"
import { displayUnreadCount } from "@/lib/graphql/notifications.contract"

/** Shared header link. Refreshes the count on focus, notification changes, and while active. */
export function NotificationsBell() {
  const { user, status } = useAuth()
  const authenticated = status === "authenticated" && user !== null
  const userId = user?.id
  const [unread, setUnread] = useState<number | null>(null)

  const refresh = useCallback(() => {
    if (!authenticated) return
    void fetchUnreadNotificationCount()
      .then((count) => setUnread(count))
      .catch(() => setUnread(null))
  }, [authenticated])

  useEffect(() => {
    if (!authenticated || !userId) return
    // Asynchronously reset the badge on account changes and refresh its count.
    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) { setUnread(null); refresh() }
    })
    function onVisible() {
      if (document.visibilityState === "visible") refresh()
    }
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh)
    window.addEventListener("focus", refresh)
    document.addEventListener("visibilitychange", onVisible)
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh()
    }, 60_000)
    return () => {
      cancelled = true
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh)
      window.removeEventListener("focus", refresh)
      document.removeEventListener("visibilitychange", onVisible)
      window.clearInterval(interval)
    }
  }, [authenticated, userId, refresh])

  if (!authenticated) return null
  const label = unread !== null && unread > 0
    ? `Notifications, ${displayUnreadCount(unread)} unread`
    : "Notifications"

  return (
    <Link href="/notifications" aria-label={label} title={label}
      className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative") }>
      <BellIcon aria-hidden="true" className="size-5" />
      {unread !== null && unread > 0 ? (
        <span aria-hidden="true" className="absolute -right-1 -top-1 flex min-w-4 h-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">
          {displayUnreadCount(unread)}
        </span>
      ) : null}
    </Link>
  )
}
