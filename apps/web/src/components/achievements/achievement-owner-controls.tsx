"use client"

import {
  useMemo,
  useState,
} from "react"

import {
  useRouter,
} from "next/navigation"

import {
  AwardIcon,
  CheckIcon,
  CrownIcon,
  LoaderCircleIcon,
  XIcon,
} from "lucide-react"

import {
  useAuth,
} from "@/components/auth/auth-provider"

import {
  Badge,
} from "@/components/ui/badge"

import {
  Button,
} from "@/components/ui/button"

import {
  equipAchievementTitle,
  setAchievementShowcase,
} from "@/lib/graphql/achievements"

import type {
  AchievementItem,
  AchievementProfile,
} from "@/lib/graphql/achievements"

type AchievementOwnerControlsProps = {
  username: string

  initialProfile:
    AchievementProfile
}

function getShowcaseSlot(
  profile:
    AchievementProfile,

  position: number,
): AchievementItem | null {
  return (
    profile.showcase.find(
      (achievement) =>
        achievement
          .showcasePosition ===
        position,
    ) ?? null
  )
}

export function AchievementOwnerControls({
  username,
  initialProfile,
}: AchievementOwnerControlsProps) {
  const router =
    useRouter()

  const {
    user,
    status,
  } = useAuth()

  const [
    profile,
    setProfile,
  ] =
    useState(
      initialProfile,
    )

  const [
    pending,
    setPending,
  ] =
    useState<
      string | null
    >(null)

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null)

  const isOwner =
    Boolean(
      user &&
        user.username
          .toLowerCase() ===
          username
            .toLowerCase(),
    )

  const unlocked =
    useMemo(
      () =>
        profile.items
          .filter(
            (
              achievement,
            ) =>
              achievement.unlocked,
          ),
      [
        profile.items,
      ],
    )

  const titleAchievements =
    useMemo(
      () =>
        unlocked.filter(
          (
            achievement,
          ) =>
            achievement
              .canEquipTitle &&
            achievement
              .titleReward,
        ),
      [
        unlocked,
      ],
    )

  if (
    status ===
      "loading" ||
    !isOwner
  ) {
    return null
  }

  async function updateShowcase(
    achievementId: string,
    position:
      number | null,
  ) {
    const key =
      `showcase:${achievementId}:${position}`

    setPending(key)
    setError(null)

    try {
      const next =
        await setAchievementShowcase(
          achievementId,
          position,
        )

      setProfile(next)

      router.refresh()
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update achievement showcase.",
      )
    } finally {
      setPending(null)
    }
  }

  async function updateTitle(
    achievementId:
      string | null,
  ) {
    const key =
      `title:${achievementId ?? "none"}`

    setPending(key)
    setError(null)

    try {
      const next =
        await equipAchievementTitle(
          achievementId,
        )

      setProfile(next)

      router.refresh()
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update achievement title.",
      )
    } finally {
      setPending(null)
    }
  }

  return (
    <section
      aria-labelledby="achievement-owner-controls"
      className="mt-12 rounded-2xl border bg-card p-5 sm:p-6"
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Profile customization
        </p>

        <h2
          id="achievement-owner-controls"
          className="mt-1 text-2xl font-semibold tracking-tight"
        >
          Showcase & title
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Choose up to three unlocked
          milestones for your profile
          and equip a title earned from
          an achievement.
        </p>
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}

      <div className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="font-semibold">
              Profile showcase
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Three public achievement
              slots.
            </p>
          </div>

          <Badge variant="outline">
            {
              profile.showcase
                .length
            }
            {" / 3"}
          </Badge>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[1, 2, 3].map(
            (position) => {
              const achievement =
                getShowcaseSlot(
                  profile,
                  position,
                )

              return (
                <div
                  key={
                    position
                  }
                  className="rounded-xl border bg-background p-4"
                >
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Slot{" "}
                    {position}
                  </p>

                  {achievement ? (
                    <>
                      <div className="mt-3 flex items-start gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border">
                          <AwardIcon
                            aria-hidden="true"
                            className="size-4"
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="font-medium">
                            {
                              achievement.name
                            }
                          </p>

                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                            {
                              achievement.description
                            }
                          </p>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-4"
                        disabled={
                          pending !==
                          null
                        }
                        onClick={() => {
                          void updateShowcase(
                            achievement.id,
                            null,
                          )
                        }}
                      >
                        {pending ===
                        `showcase:${achievement.id}:null` ? (
                          <LoaderCircleIcon className="animate-spin" />
                        ) : (
                          <XIcon />
                        )}

                        Remove
                      </Button>
                    </>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">
                      Empty slot.
                    </p>
                  )}
                </div>
              )
            },
          )}
        </div>

        {unlocked.length >
        0 ? (
          <div className="mt-5 space-y-3">
            {unlocked.map(
              (
                achievement,
              ) => (
                <div
                  key={
                    achievement.id
                  }
                  className="flex flex-col gap-4 rounded-xl border bg-background p-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">
                        {
                          achievement.name
                        }
                      </p>

                      {achievement.showcasePosition !==
                      null ? (
                        <Badge variant="secondary">
                          Slot{" "}
                          {
                            achievement.showcasePosition
                          }
                        </Badge>
                      ) : null}
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {
                        achievement.description
                      }
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {[1, 2, 3].map(
                      (
                        position,
                      ) => {
                        const selected =
                          achievement
                            .showcasePosition ===
                          position

                        const key =
                          `showcase:${achievement.id}:${position}`

                        return (
                          <Button
                            key={
                              position
                            }
                            type="button"
                            size="sm"
                            variant={
                              selected
                                ? "secondary"
                                : "outline"
                            }
                            disabled={
                              selected ||
                              pending !==
                                null
                            }
                            onClick={() => {
                              void updateShowcase(
                                achievement.id,
                                position,
                              )
                            }}
                          >
                            {pending ===
                            key ? (
                              <LoaderCircleIcon className="animate-spin" />
                            ) : selected ? (
                              <CheckIcon />
                            ) : null}

                            Slot{" "}
                            {
                              position
                            }
                          </Button>
                        )
                      },
                    )}
                  </div>
                </div>
              ),
            )}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed px-5 py-8 text-center">
            <p className="font-medium">
              No unlocked achievements
              yet.
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Complete milestones before
              adding them to your
              showcase.
            </p>
          </div>
        )}
      </div>

      <div className="mt-10 border-t pt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="font-semibold">
              Equipped title
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Display one earned title
              beside your profile name.
            </p>
          </div>

          {profile.equippedTitle ? (
            <Badge variant="secondary">
              <CrownIcon />
              {
                profile
                  .equippedTitle
                  .title
              }
            </Badge>
          ) : null}
        </div>

        {titleAchievements.length >
        0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {titleAchievements.map(
              (
                achievement,
              ) => {
                const equipped =
                  profile
                    .equippedTitle
                    ?.achievementId ===
                  achievement.id

                const key =
                  `title:${achievement.id}`

                return (
                  <div
                    key={
                      achievement.id
                    }
                    className="flex items-center justify-between gap-4 rounded-xl border bg-background p-4"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">
                        {
                          achievement.titleReward
                        }
                      </p>

                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        From{" "}
                        {
                          achievement.name
                        }
                      </p>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant={
                        equipped
                          ? "secondary"
                          : "outline"
                      }
                      disabled={
                        equipped ||
                        pending !==
                          null
                      }
                      onClick={() => {
                        void updateTitle(
                          achievement.id,
                        )
                      }}
                    >
                      {pending ===
                      key ? (
                        <LoaderCircleIcon className="animate-spin" />
                      ) : equipped ? (
                        <CheckIcon />
                      ) : (
                        <CrownIcon />
                      )}

                      {equipped
                        ? "Equipped"
                        : "Equip"}
                    </Button>
                  </div>
                )
              },
            )}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed px-5 py-8 text-center">
            <p className="font-medium">
              No achievement titles
              unlocked yet.
            </p>
          </div>
        )}

        {profile.equippedTitle ? (
          <Button
            type="button"
            variant="ghost"
            className="mt-4"
            disabled={
              pending !== null
            }
            onClick={() => {
              void updateTitle(
                null,
              )
            }}
          >
            {pending ===
            "title:none" ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <XIcon />
            )}

            Unequip title
          </Button>
        ) : null}
      </div>
    </section>
  )
}
