"use client"

import Link from "next/link"
import {
  useEffect,
  useState,
} from "react"
import {
  CheckIcon,
  ListPlusIcon,
  LoaderCircleIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  GraphQLRequestError,
} from "@/lib/graphql/client"
import {
  getMyAnimeListEntry,
  removeAnimeListEntry,
  upsertAnimeListEntry,
} from "@/lib/graphql/tracking"

import type {
  AnimeListEntry,
  AnimeListStatus,
} from "@/lib/graphql/tracking"

type AnimeTrackingControlProps = {
  animeId: string
  episodes: number | null
}

type LoadState =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "error"

const STATUS_LABELS:
  Record<
    AnimeListStatus,
    string
  > = {
    PLANNING: "Planning",
    WATCHING: "Watching",
    COMPLETED: "Completed",
    PAUSED: "Paused",
    DROPPED: "Dropped",
    REWATCHING: "Rewatching",
  }

const BASE_STATUSES:
  AnimeListStatus[] = [
    "PLANNING",
    "WATCHING",
    "COMPLETED",
    "PAUSED",
    "DROPPED",
  ]

const SCORE_OPTIONS =
  Array.from(
    {
      length: 19,
    },
    (_, index) =>
      1 + index * 0.5,
  )

function AnimeTrackingControl({
  animeId,
  episodes,
}: AnimeTrackingControlProps) {
  const [
    loadState,
    setLoadState,
  ] =
    useState<LoadState>(
      "loading",
    )

  const [
    entry,
    setEntry,
  ] =
    useState<
      AnimeListEntry | null
    >(null)

  const [
    reloadKey,
    setReloadKey,
  ] =
    useState(0)

  const [
    editing,
    setEditing,
  ] =
    useState(false)

  const [
    saving,
    setSaving,
  ] =
    useState(false)

  const [
    removing,
    setRemoving,
  ] =
    useState(false)

  const [
    status,
    setStatus,
  ] =
    useState<AnimeListStatus>(
      "PLANNING",
    )

  const [
    progress,
    setProgress,
  ] =
    useState("0")

  const [
    score,
    setScore,
  ] =
    useState("")

  useEffect(
    () => {
      let active = true

      async function load() {
        try {
          const result =
            await getMyAnimeListEntry(
              animeId,
            )

          if (!active) {
            return
          }

          setEntry(result)

          if (result) {
            populateForm(
              result,
            )
          }

          setLoadState(
            "authenticated",
          )
        } catch (error) {
          if (!active) {
            return
          }

          if (
            error instanceof
              GraphQLRequestError &&
            error.code ===
              "UNAUTHENTICATED"
          ) {
            setLoadState(
              "unauthenticated",
            )

            return
          }

          setLoadState(
            "error",
          )
        }
      }

      void load()

      return () => {
        active = false
      }
    },
    [
      animeId,
      reloadKey,
    ],
  )

  function populateForm(
    value: AnimeListEntry,
  ) {
    setStatus(
      value.status,
    )

    setProgress(
      String(
        value.progressEpisodes,
      ),
    )

    setScore(
      value.score === null
        ? ""
        : String(
            value.score,
          ),
    )
  }

  function beginAdd() {
    setStatus("PLANNING")
    setProgress("0")
    setScore("")
    setEditing(true)
  }

  function beginEdit() {
    if (entry) {
      populateForm(entry)
    }

    setEditing(true)
  }

  function cancelEdit() {
    if (entry) {
      populateForm(entry)
    }

    setEditing(false)
  }

  function changeStatus(
    nextStatus: AnimeListStatus,
  ) {
    if (
      nextStatus ===
        "REWATCHING" &&
      status !==
        "REWATCHING"
    ) {
      setProgress("0")
    }

    if (
      nextStatus ===
        "COMPLETED" &&
      episodes !== null
    ) {
      setProgress(
        String(episodes),
      )
    }

    setStatus(nextStatus)
  }

  async function saveEntry() {
    const parsedProgress =
      Number.parseInt(
        progress,
        10,
      )

    if (
      !Number.isInteger(
        parsedProgress,
      ) ||
      parsedProgress < 0
    ) {
      toast.error(
        "Episode progress must be zero or greater.",
      )

      return
    }

    if (
      episodes !== null &&
      parsedProgress >
        episodes
    ) {
      toast.error(
        `Progress cannot exceed ${episodes} episodes.`,
      )

      return
    }

    const parsedScore =
      score === ""
        ? null
        : Number(score)

    setSaving(true)

    try {
      const result =
        await upsertAnimeListEntry({
          animeId,

          status,

          progressEpisodes:
            parsedProgress,

          score:
            parsedScore,
        })

      setEntry(result)

      populateForm(
        result,
      )

      setEditing(false)

      toast.success(
        entry
          ? "Anime list updated."
          : "Anime added to your list.",
      )
    } catch (error) {
      if (
        error instanceof
        GraphQLRequestError
      ) {
        toast.error(
          error.message,
        )
      } else {
        toast.error(
          "Unable to update your anime list.",
        )
      }
    } finally {
      setSaving(false)
    }
  }

  async function removeEntry() {
    if (!entry) {
      return
    }

    setRemoving(true)

    try {
      const removed =
        await removeAnimeListEntry(
          animeId,
        )

      if (!removed) {
        toast.error(
          "Anime list entry was not found.",
        )

        return
      }

      setEntry(null)

      setStatus(
        "PLANNING",
      )

      setProgress("0")
      setScore("")
      setEditing(false)

      toast.success(
        "Anime removed from your list.",
      )
    } catch (error) {
      if (
        error instanceof
        GraphQLRequestError
      ) {
        toast.error(
          error.message,
        )
      } else {
        toast.error(
          "Unable to remove this anime.",
        )
      }
    } finally {
      setRemoving(false)
    }
  }

  const allowRewatching =
    entry !== null &&
    (
      entry.status ===
        "COMPLETED" ||
      entry.status ===
        "REWATCHING" ||
      entry.rewatchCount > 0
    )

  const statuses =
    allowRewatching
      ? [
          ...BASE_STATUSES,
          "REWATCHING" as const,
        ]
      : BASE_STATUSES

  if (
    loadState ===
    "loading"
  ) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4">
        <Button
          className="w-full"
          disabled
        >
          <LoaderCircleIcon className="animate-spin" />
          Loading list status
        </Button>
      </div>
    )
  }

  if (
    loadState ===
    "unauthenticated"
  ) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="mb-3 text-sm text-muted-foreground">
          Sign in to track this
          anime, update your
          progress, and give it
          a score.
        </p>

        <Button
          nativeButton={false}
          className="w-full"
          render={
            <Link
              href="/login"
            />
          }
        >
          <ListPlusIcon />
          Sign in to track
        </Button>
      </div>
    )
  }

  if (
    loadState ===
    "error"
  ) {
    return (
      <div
        className="rounded-xl border border-border bg-surface p-4"
        role="status"
      >
        <p className="text-sm text-muted-foreground">
          Your list status could
          not be loaded right now.
        </p>

        <Button
          variant="outline"
          className="mt-3 w-full"
          onClick={() => {
            setLoadState(
              "loading",
            )

            setReloadKey(
              (value) =>
                value + 1,
            )
          }}
        >
          Try again
        </Button>
      </div>
    )
  }

  if (!entry && !editing) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4">
        <Button
          className="w-full"
          onClick={
            beginAdd
          }
        >
          <ListPlusIcon />
          Add to List
        </Button>
      </div>
    )
  }

  if (
    entry &&
    !editing
  ) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Your list
            </p>

            <p className="mt-1 font-medium">
              {
                STATUS_LABELS[
                  entry.status
                ]
              }
            </p>
          </div>

          <CheckIcon className="mt-1 size-4 text-primary" />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">
              Progress
            </dt>

            <dd className="mt-1">
              {
                entry
                  .progressEpisodes
              }
              {episodes !== null
                ? ` / ${episodes}`
                : ""}
            </dd>
          </div>

          <div>
            <dt className="text-xs text-muted-foreground">
              Score
            </dt>

            <dd className="mt-1">
              {entry.score ??
                "—"}
            </dd>
          </div>

          {entry.rewatchCount >
          0 ? (
            <div>
              <dt className="text-xs text-muted-foreground">
                Rewatches
              </dt>

              <dd className="mt-1">
                {
                  entry.rewatchCount
                }
              </dd>
            </div>
          ) : null}
        </dl>

        <Button
          variant="outline"
          className="mt-4 w-full"
          onClick={
            beginEdit
          }
        >
          <PencilIcon />
          Edit List Entry
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="space-y-4">
        <div>
          <label
            htmlFor={`tracking-status-${animeId}`}
            className="mb-1.5 block text-xs font-medium text-muted-foreground"
          >
            Status
          </label>

          <select
            id={`tracking-status-${animeId}`}
            value={status}
            onChange={(
              event,
            ) =>
              changeStatus(
                event.target
                  .value as
                  AnimeListStatus,
              )
            }
            disabled={
              saving ||
              removing
            }
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
          >
            {statuses.map(
              (value) => (
                <option
                  key={value}
                  value={value}
                >
                  {
                    STATUS_LABELS[
                      value
                    ]
                  }
                </option>
              ),
            )}
          </select>
        </div>

        <div>
          <label
            htmlFor={`tracking-progress-${animeId}`}
            className="mb-1.5 block text-xs font-medium text-muted-foreground"
          >
            Episode progress
          </label>

          <Input
            id={`tracking-progress-${animeId}`}
            type="number"
            min={0}
            max={
              episodes ??
              undefined
            }
            step={1}
            value={
              status ===
                "COMPLETED" &&
              episodes !== null
                ? String(
                    episodes,
                  )
                : progress
            }
            disabled={
              saving ||
              removing ||
              (
                status ===
                  "COMPLETED" &&
                episodes !==
                  null
              )
            }
            onChange={(
              event,
            ) =>
              setProgress(
                event.target
                  .value,
              )
            }
          />

          {episodes !== null ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {episodes} total
              episodes
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor={`tracking-score-${animeId}`}
            className="mb-1.5 block text-xs font-medium text-muted-foreground"
          >
            Score
          </label>

          <select
            id={`tracking-score-${animeId}`}
            value={score}
            onChange={(
              event,
            ) =>
              setScore(
                event.target
                  .value,
              )
            }
            disabled={
              saving ||
              removing
            }
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
          >
            <option value="">
              No score
            </option>

            {SCORE_OPTIONS.map(
              (value) => (
                <option
                  key={value}
                  value={value}
                >
                  {value.toFixed(
                    1,
                  )}
                </option>
              ),
            )}
          </select>
        </div>

        <div className="flex gap-2">
          <Button
            className="flex-1"
            disabled={
              saving ||
              removing
            }
            onClick={() =>
              void saveEntry()
            }
          >
            {saving ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <CheckIcon />
            )}

            Save
          </Button>

          <Button
            variant="outline"
            disabled={
              saving ||
              removing
            }
            onClick={
              cancelEdit
            }
          >
            Cancel
          </Button>
        </div>

        {entry ? (
          <Button
            variant="destructive"
            className="w-full"
            disabled={
              saving ||
              removing
            }
            onClick={() =>
              void removeEntry()
            }
          >
            {removing ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <Trash2Icon />
            )}

            Remove from List
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export {
  AnimeTrackingControl,
}
