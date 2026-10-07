"use client"

import Link from "next/link"
import {
  useSyncExternalStore,
} from "react"

import type {
  AiringScheduleItem,
} from "@/lib/graphql/airing"

type AiringScheduleListProps = {
  items: AiringScheduleItem[]
}

type ScheduleGroup = {
  key: string
  label: string
  items: AiringScheduleItem[]
}

function subscribe() {
  return () => {}
}

function formatDay(
  value: string,
  local: boolean,
): {
  key: string
  label: string
} {
  const date =
    new Date(value)

  const timeZone =
    local
      ? undefined
      : "UTC"

  const key =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone,
      },
    ).format(date)

  const label =
    new Intl.DateTimeFormat(
      undefined,
      {
        weekday: "long",
        month: "long",
        day: "numeric",
        timeZone,
      },
    ).format(date)

  return {
    key,
    label,
  }
}

function formatTime(
  value: string,
  local: boolean,
): string {
  return new Intl.DateTimeFormat(
    undefined,
    {
      hour: "2-digit",
      minute: "2-digit",
      timeZone:
        local
          ? undefined
          : "UTC",
    },
  ).format(
    new Date(value),
  )
}

function groupSchedule(
  items: AiringScheduleItem[],
  local: boolean,
): ScheduleGroup[] {
  const groups =
    new Map<
      string,
      ScheduleGroup
    >()

  for (const item of items) {
    const day =
      formatDay(
        item.airingAt,
        local,
      )

    const existing =
      groups.get(day.key)

    if (existing) {
      existing.items.push(
        item,
      )

      continue
    }

    groups.set(
      day.key,
      {
        key:
          day.key,

        label:
          day.label,

        items: [
          item,
        ],
      },
    )
  }

  return [
    ...groups.values(),
  ]
}

function formatSeason(
  item: AiringScheduleItem,
): string | null {
  const {
    season,
    seasonYear,
  } = item.anime

  if (
    !season &&
    !seasonYear
  ) {
    return null
  }

  if (
    season &&
    seasonYear
  ) {
    return `${
      season.charAt(0) +
      season
        .slice(1)
        .toLowerCase()
    } ${seasonYear}`
  }

  if (season) {
    return (
      season.charAt(0) +
      season
        .slice(1)
        .toLowerCase()
    )
  }

  return String(
    seasonYear,
  )
}

export function AiringScheduleList({
  items,
}: AiringScheduleListProps) {
  const isClient =
    useSyncExternalStore(
      subscribe,
      () => true,
      () => false,
    )

  const groups =
    groupSchedule(
      items,
      isClient,
    )

  if (
    items.length === 0
  ) {
    return (
      <div className="rounded-2xl border border-dashed py-16 text-center">
        <h2 className="text-lg font-semibold">
          No scheduled episodes
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          No upcoming episodes from the
          local anime catalog were found
          in this range.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {groups.map(
        (group) => (
          <section
            key={
              group.key
            }
            aria-labelledby={
              `schedule-${group.key}`
            }
          >
            <div className="mb-4 flex items-baseline justify-between gap-4 border-b pb-3">
              <h2
                id={
                  `schedule-${group.key}`
                }
                className="text-xl font-semibold tracking-tight"
              >
                {group.label}
              </h2>

              <span className="text-xs text-muted-foreground">
                {
                  group.items
                    .length
                }{" "}
                {
                  group.items
                    .length === 1
                    ? "episode"
                    : "episodes"
                }
              </span>
            </div>

            <div className="divide-y rounded-2xl border bg-card">
              {group.items.map(
                (
                  item,
                  index,
                ) => {
                  const season =
                    formatSeason(
                      item,
                    )

                  return (
                    <Link
                      key={`${item.anime.id}-${item.episode}-${item.airingAt}-${index}`}
                      href={`/anime/${item.anime.slug}`}
                      className="group grid gap-3 p-4 transition-colors hover:bg-muted/40 sm:grid-cols-[90px_minmax(0,1fr)_auto] sm:items-center sm:gap-5"
                    >
                      <div>
                        <time
                          dateTime={
                            item.airingAt
                          }
                          className="text-lg font-semibold tabular-nums"
                        >
                          {formatTime(
                            item.airingAt,
                            isClient,
                          )}
                        </time>

                        {!isClient ? (
                          <p className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                            UTC
                          </p>
                        ) : null}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate font-medium transition-colors group-hover:text-primary">
                          {
                            item.anime
                              .title
                          }
                        </h3>

                        <div className="mt-1 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                          <span>
                            {
                              item.anime
                                .format
                            }
                          </span>

                          {season ? (
                            <>
                              <span
                                aria-hidden="true"
                              >
                                ·
                              </span>

                              <span>
                                {season}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>

                      <div className="sm:text-right">
                        <span className="inline-flex rounded-full border bg-background px-3 py-1 text-xs font-medium">
                          Episode{" "}
                          {
                            item.episode
                          }
                        </span>
                      </div>
                    </Link>
                  )
                },
              )}
            </div>
          </section>
        ),
      )}
    </div>
  )
}
