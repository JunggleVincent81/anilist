import Link from "next/link"
import {
  notFound,
} from "next/navigation"

import {
  AwardIcon,
  CheckIcon,
  LockIcon,
} from "lucide-react"

import {
  AchievementOwnerControls,
} from "@/components/achievements/achievement-owner-controls"

import {
  ContentSection,
} from "@/components/layout/content-section"

import {
  PageContainer,
} from "@/components/layout/page-container"

import {
  Badge,
} from "@/components/ui/badge"

import {
  Button,
} from "@/components/ui/button"

import {
  getUserAchievements,
} from "@/lib/graphql/achievements"

import type {
  AchievementCategory,
  AchievementItem,
} from "@/lib/graphql/achievements"

type UserAchievementsPageProps = {
  params: Promise<{
    username: string
  }>
}

const CATEGORY_ORDER:
  AchievementCategory[] = [
    "JOURNEY",
    "COMPLETION",
    "EPISODES",
    "RATING",
    "REWATCH",
    "FAVORITES",
    "GENRE",
  ]

const CATEGORY_LABELS:
  Record<
    AchievementCategory,
    string
  > = {
    JOURNEY: "Journey",
    COMPLETION: "Completion",
    EPISODES: "Episodes",
    RATING: "Rating",
    REWATCH: "Rewatch",
    FAVORITES: "Favorites",
    GENRE: "Genres",
  }

const CATEGORY_DESCRIPTIONS:
  Record<
    AchievementCategory,
    string
  > = {
    JOURNEY:
      "Milestones from building your anime history.",

    COMPLETION:
      "Progress earned by completing anime.",

    EPISODES:
      "Milestones based on episodes watched.",

    RATING:
      "Achievements from recording your opinions.",

    REWATCH:
      "Milestones from returning to anime again.",

    FAVORITES:
      "Achievements earned from your personal favorites.",

    GENRE:
      "Milestones tied to genre-specific viewing.",
  }

function formatUnlockedAt(
  value: string | null,
): string | null {
  if (!value) {
    return null
  }

  return new Intl.DateTimeFormat(
    "en",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  ).format(
    new Date(value),
  )
}

function AchievementProgress({
  achievement,
}: {
  achievement: AchievementItem
}) {
  const percentage =
    Math.min(
      100,
      Math.max(
        0,
        achievement.progressPercent,
      ),
    )

  return (
    <div>
      <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
        <span>
          Progress
        </span>

        <span className="tabular-nums">
          {achievement.progress}
          {" / "}
          {achievement.threshold}
        </span>
      </div>

      <div
        role="progressbar"
        aria-label={`${achievement.name} progress`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-foreground transition-[width]"
          style={{
            width:
              `${percentage}%`,
          }}
        />
      </div>
    </div>
  )
}

function AchievementCard({
  achievement,
}: {
  achievement: AchievementItem
}) {
  const unlockedAt =
    formatUnlockedAt(
      achievement.unlockedAt,
    )

  return (
    <article
      className={[
        "relative overflow-hidden rounded-2xl border p-5",
        achievement.unlocked
          ? "bg-card"
          : "bg-muted/20",
      ].join(" ")}
    >
      <div className="flex items-start gap-4">
        <div
          className={[
            "flex size-11 shrink-0 items-center justify-center rounded-xl border",
            achievement.unlocked
              ? "bg-background"
              : "bg-muted/40 text-muted-foreground",
          ].join(" ")}
        >
          {achievement.unlocked ? (
            <AwardIcon
              aria-hidden="true"
              className="size-5"
            />
          ) : (
            <LockIcon
              aria-hidden="true"
              className="size-4"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold tracking-tight">
                {achievement.name}
              </h3>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {achievement.description}
              </p>
            </div>

            <Badge
              variant={
                achievement.unlocked
                  ? "default"
                  : "outline"
              }
            >
              {achievement.unlocked ? (
                <>
                  <CheckIcon
                    aria-hidden="true"
                    className="size-3"
                  />
                  Unlocked
                </>
              ) : (
                "Locked"
              )}
            </Badge>
          </div>

          <div className="mt-5">
            <AchievementProgress
              achievement={
                achievement
              }
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            {achievement.titleReward ? (
              <span>
                Title reward:{" "}
                <span className="font-medium text-foreground">
                  {
                    achievement.titleReward
                  }
                </span>
              </span>
            ) : null}

            {unlockedAt ? (
              <span>
                Unlocked{" "}
                {unlockedAt}
              </span>
            ) : null}

            {achievement.showcasePosition !==
            null ? (
              <span>
                Showcase slot{" "}
                {
                  achievement.showcasePosition
                }
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}

export default async function UserAchievementsPage({
  params,
}: UserAchievementsPageProps) {
  const {
    username,
  } = await params

  const achievements =
    await getUserAchievements(
      username,
    )

  if (!achievements) {
    notFound()
  }

  const completionPercent =
    achievements.total > 0
      ? Math.round(
          (
            achievements.unlockedCount /
            achievements.total
          ) *
            100,
        )
      : 0

  const grouped =
    new Map<
      AchievementCategory,
      AchievementItem[]
    >()

  for (
    const category
    of CATEGORY_ORDER
  ) {
    grouped.set(
      category,
      [],
    )
  }

  for (
    const achievement
    of achievements.items
  ) {
    grouped
      .get(
        achievement.category,
      )
      ?.push(
        achievement,
      )
  }

  return (
    <main>
      <PageContainer>
        <ContentSection spacing="lg">
          <div className="mx-auto w-full max-w-6xl">
            <div className="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Achievements
                </p>

                <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
                  @{achievements.username}
                  &apos;s milestones
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Permanent milestones
                  earned from this
                  user&apos;s anime
                  journey.
                </p>
              </div>

              <Button
                nativeButton={false}
                variant="outline"
                render={
                  <Link
                    href={`/user/${achievements.username}`}
                  />
                }
              >
                View Profile
              </Button>
            </div>

            <section
              aria-labelledby="achievement-progress"
              className="mt-8 grid gap-4 md:grid-cols-3"
            >
              <div className="rounded-2xl border bg-card p-5">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Unlocked
                </p>

                <p
                  id="achievement-progress"
                  className="mt-2 text-3xl font-semibold tracking-tight"
                >
                  {
                    achievements.unlockedCount
                  }
                  <span className="text-base font-normal text-muted-foreground">
                    {" / "}
                    {
                      achievements.total
                    }
                  </span>
                </p>

                <div
                  role="progressbar"
                  aria-label="Achievement completion"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={
                    completionPercent
                  }
                  className="mt-4 h-2 overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className="h-full rounded-full bg-foreground"
                    style={{
                      width:
                        `${completionPercent}%`,
                    }}
                  />
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  {
                    completionPercent
                  }
                  % complete
                </p>
              </div>

              <div className="rounded-2xl border bg-card p-5">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Equipped title
                </p>

                <p className="mt-2 text-xl font-semibold tracking-tight">
                  {
                    achievements
                      .equippedTitle
                      ?.title ??
                    "No title equipped"
                  }
                </p>

                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Titles are earned from
                  selected achievements.
                </p>
              </div>

              <div className="rounded-2xl border bg-card p-5">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Showcase
                </p>

                <p className="mt-2 text-xl font-semibold tracking-tight">
                  {
                    achievements.showcase
                      .length
                  }
                  <span className="text-base font-normal text-muted-foreground">
                    {" / 3"}
                  </span>
                </p>

                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Milestones selected
                  for profile display.
                </p>
              </div>
            </section>

            <AchievementOwnerControls
              username={
                achievements.username
              }
              initialProfile={
                achievements
              }
            />

            <section
              aria-labelledby="achievement-showcase"
              className="mt-12"
            >
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Showcase
                </p>

                <h2
                  id="achievement-showcase"
                  className="mt-1 text-2xl font-semibold tracking-tight"
                >
                  Featured milestones
                </h2>
              </div>

              {achievements.showcase.length >
              0 ? (
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  {achievements.showcase.map(
                    (
                      achievement,
                    ) => (
                      <div
                        key={
                          achievement.id
                        }
                        className="rounded-2xl border bg-card p-5"
                      >
                        <div className="flex size-10 items-center justify-center rounded-xl border bg-background">
                          <AwardIcon
                            aria-hidden="true"
                            className="size-5"
                          />
                        </div>

                        <p className="mt-4 font-semibold">
                          {
                            achievement.name
                          }
                        </p>

                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {
                            achievement.description
                          }
                        </p>

                        {achievement.titleReward ? (
                          <Badge
                            variant="outline"
                            className="mt-4"
                          >
                            {
                              achievement.titleReward
                            }
                          </Badge>
                        ) : null}
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed px-6 py-12 text-center">
                  <AwardIcon
                    aria-hidden="true"
                    className="mx-auto size-6 text-muted-foreground"
                  />

                  <p className="mt-4 font-medium">
                    No showcased
                    achievements yet.
                  </p>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                    Unlocked milestones
                    can be selected for
                    this profile showcase.
                  </p>
                </div>
              )}
            </section>

            {achievements.items.length >
            0 ? (
              <div className="mt-12 space-y-12">
                {CATEGORY_ORDER.map(
                  (
                    category,
                  ) => {
                    const items =
                      grouped.get(
                        category,
                      ) ?? []

                    if (
                      items.length ===
                      0
                    ) {
                      return null
                    }

                    return (
                      <section
                        key={
                          category
                        }
                        aria-labelledby={`achievement-category-${category}`}
                      >
                        <div className="flex flex-col gap-1 border-b pb-4">
                          <h2
                            id={`achievement-category-${category}`}
                            className="text-xl font-semibold tracking-tight"
                          >
                            {
                              CATEGORY_LABELS[
                                category
                              ]
                            }
                          </h2>

                          <p className="text-sm text-muted-foreground">
                            {
                              CATEGORY_DESCRIPTIONS[
                                category
                              ]
                            }
                          </p>
                        </div>

                        <div className="mt-5 grid gap-4 lg:grid-cols-2">
                          {items.map(
                            (
                              achievement,
                            ) => (
                              <AchievementCard
                                key={
                                  achievement.id
                                }
                                achievement={
                                  achievement
                                }
                              />
                            ),
                          )}
                        </div>
                      </section>
                    )
                  },
                )}
              </div>
            ) : (
              <div className="mt-12 rounded-2xl border border-dashed px-6 py-16 text-center">
                <AwardIcon
                  aria-hidden="true"
                  className="mx-auto size-7 text-muted-foreground"
                />

                <p className="mt-4 font-medium">
                  No achievements
                  available.
                </p>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  Achievement milestones
                  will appear here when
                  the catalog becomes
                  available.
                </p>
              </div>
            )}
          </div>
        </ContentSection>
      </PageContainer>
    </main>
  )
}
