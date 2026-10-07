"use client"

import {
  useState,
} from "react"
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LoaderCircleIcon,
  PencilIcon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  Button,
} from "@/components/ui/button"
import {
  Input,
} from "@/components/ui/input"
import {
  GraphQLRequestError,
} from "@/lib/graphql/client"
import {
  upsertAnimeListEntry,
} from "@/lib/graphql/tracking"

import type {
  AnimeListEntry,
  AnimeListStatus,
} from "@/lib/graphql/tracking"

type AnimeListEntryEditorProps = {
  entry: AnimeListEntry

  onUpdated: (
    entry: AnimeListEntry,
  ) => void
}

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

function AnimeListEntryEditor({
  entry,
  onUpdated,
}: AnimeListEntryEditorProps) {
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
    status,
    setStatus,
  ] =
    useState<
      AnimeListStatus
    >(entry.status)

  const [
    progress,
    setProgress,
  ] =
    useState(
      String(
        entry.progressEpisodes,
      ),
    )

  const [
    score,
    setScore,
  ] =
    useState(
      entry.score === null
        ? ""
        : String(
            entry.score,
          ),
    )

  const episodes =
    entry.anime.episodes

  const allowRewatching =
    entry.status ===
      "COMPLETED" ||
    entry.status ===
      "REWATCHING" ||
    entry.rewatchCount > 0

  const statuses =
    allowRewatching
      ? [
          ...BASE_STATUSES,
          "REWATCHING" as const,
        ]
      : BASE_STATUSES

  function resetForm() {
    setStatus(
      entry.status,
    )

    setProgress(
      String(
        entry.progressEpisodes,
      ),
    )

    setScore(
      entry.score === null
        ? ""
        : String(
            entry.score,
          ),
    )
  }

  function changeStatus(
    nextStatus:
      AnimeListStatus,
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

    setStatus(
      nextStatus,
    )
  }

  function changeProgress(
    amount: number,
  ) {
    const current =
      Number.parseInt(
        progress,
        10,
      )

    const base =
      Number.isInteger(
        current,
      )
        ? current
        : 0

    let next =
      Math.max(
        base + amount,
        0,
      )

    if (
      episodes !== null
    ) {
      next =
        Math.min(
          next,
          episodes,
        )
    }

    setProgress(
      String(next),
    )
  }

  async function save() {
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
      const updated =
        await upsertAnimeListEntry({
          animeId:
            entry.anime.id,

          status,

          progressEpisodes:
            parsedProgress,

          score:
            parsedScore,
        })

      onUpdated(
        updated,
      )

      setStatus(
        updated.status,
      )

      setProgress(
        String(
          updated.progressEpisodes,
        ),
      )

      setScore(
        updated.score === null
          ? ""
          : String(
              updated.score,
            ),
      )

      setEditing(false)

      toast.success(
        "Anime list updated.",
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
          "Unable to update this entry.",
        )
      }
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          resetForm()
          setEditing(true)
        }}
      >
        <PencilIcon />
        Edit
      </Button>
    )
  }

  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label
            htmlFor={`list-status-${entry.id}`}
            className="mb-1.5 block text-xs font-medium text-muted-foreground"
          >
            Status
          </label>

          <select
            id={`list-status-${entry.id}`}
            value={status}
            disabled={saving}
            onChange={(
              event,
            ) =>
              changeStatus(
                event.target
                  .value as
                  AnimeListStatus,
              )
            }
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
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
            htmlFor={`list-progress-${entry.id}`}
            className="mb-1.5 block text-xs font-medium text-muted-foreground"
          >
            Progress
          </label>

          <div className="flex gap-1.5">
            <Button
              type="button"
              size="icon"
              variant="outline"
              disabled={
                saving ||
                (
                  status ===
                    "COMPLETED" &&
                  episodes !==
                    null
                )
              }
              aria-label="Decrease episode progress"
              onClick={() =>
                changeProgress(
                  -1,
                )
              }
            >
              <ChevronDownIcon />
            </Button>

            <Input
              id={`list-progress-${entry.id}`}
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

            <Button
              type="button"
              size="icon"
              variant="outline"
              disabled={
                saving ||
                (
                  status ===
                    "COMPLETED" &&
                  episodes !==
                    null
                )
              }
              aria-label="Increase episode progress"
              onClick={() =>
                changeProgress(
                  1,
                )
              }
            >
              <ChevronUpIcon />
            </Button>
          </div>
        </div>

        <div>
          <label
            htmlFor={`list-score-${entry.id}`}
            className="mb-1.5 block text-xs font-medium text-muted-foreground"
          >
            Score
          </label>

          <select
            id={`list-score-${entry.id}`}
            value={score}
            disabled={saving}
            onChange={(
              event,
            ) =>
              setScore(
                event.target
                  .value,
              )
            }
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
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
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={saving}
          onClick={() => {
            resetForm()
            setEditing(false)
          }}
        >
          <XIcon />
          Cancel
        </Button>

        <Button
          size="sm"
          disabled={saving}
          onClick={() =>
            void save()
          }
        >
          {saving ? (
            <LoaderCircleIcon className="animate-spin" />
          ) : (
            <CheckIcon />
          )}

          Save
        </Button>
      </div>
    </div>
  )
}

export {
  AnimeListEntryEditor,
}
