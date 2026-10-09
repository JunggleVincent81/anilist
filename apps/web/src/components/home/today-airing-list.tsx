"use client"

import Link from "next/link"
import { useSyncExternalStore } from "react"
import type { AiringScheduleItem } from "@/lib/graphql/airing"
import { todayAiringItems } from "@/lib/home/seasonal-airing-policy"

function subscribe() { return () => {} }
function browserSnapshot() { return true }
function serverSnapshot() { return false }

export function TodayAiringList({ items }: { items: AiringScheduleItem[] }) {
  // UTC for server-render + hydration, then switch to visitor local timezone.
  const isClient = useSyncExternalStore(subscribe, browserSnapshot, serverSnapshot)
  const now = new Date()
  const today = todayAiringItems(items, now, isClient)
  return (
    <div>
      <p className="mb-3 text-xs text-muted-foreground">
        Upcoming episodes today · {isClient ? "Your local time" : "UTC (loading local time)"}
      </p>
      {today.length === 0 ? (
        <p role="status" className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
          No more verified upcoming episodes for today in this preview. See the full schedule for other days.
        </p>
      ) : (
        <ul className="divide-y divide-border" aria-label="Today's upcoming anime episodes">
          {today.map((item) => (
            <li key={`${item.anime.id}-${item.episode}-${item.airingAt}`}>
              <Link
                href={`/anime/${encodeURIComponent(item.anime.slug)}`}
                className="group flex items-center gap-3 rounded-md py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <time dateTime={item.airingAt} className="w-16 shrink-0 text-xs font-semibold tabular-nums text-primary">
                  {new Intl.DateTimeFormat("en-GB", {
                    hour: "2-digit", minute: "2-digit", hour12: false,
                    timeZone: isClient ? undefined : "UTC",
                  }).format(new Date(item.airingAt))}
                </time>
                <span className="min-w-0 flex-1 truncate text-sm font-medium group-hover:text-primary">
                  {item.anime.title}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">Ep {item.episode}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
