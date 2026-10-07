import Link from "next/link"

import type {
  AnimeListEntry,
} from "@/lib/graphql/tracking"

type AnimeListEntryCardProps = {
  entry: AnimeListEntry
}

const STATUS_LABELS = {
  PLANNING: "Planning",
  WATCHING: "Watching",
  COMPLETED: "Completed",
  PAUSED: "Paused",
  DROPPED: "Dropped",
  REWATCHING: "Rewatching",
} as const

function AnimeListEntryCard({
  entry,
}: AnimeListEntryCardProps) {
  const {
    anime,
  } = entry

  const metadata = [
    anime.format !== "UNKNOWN"
      ? anime.format.replaceAll(
          "_",
          " ",
        )
      : null,

    anime.season &&
    anime.seasonYear
      ? `${anime.season} ${anime.seasonYear}`
      : anime.seasonYear
        ? String(
            anime.seasonYear,
          )
        : null,
  ].filter(
    (
      value,
    ): value is string =>
      Boolean(value),
  )

  return (
    <article className="overflow-hidden rounded-xl border bg-card transition-colors hover:bg-muted/20">
      <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-4 p-3 sm:grid-cols-[6rem_minmax(0,1fr)_10rem] sm:items-center sm:p-4">
        <Link
          href={`/anime/${anime.slug}`}
          className="aspect-[2/3] overflow-hidden rounded-lg border bg-muted"
          aria-label={`Open ${anime.title}`}
        >
          {anime.coverImageUrl ? (
            <div
              role="img"
              aria-label={`${anime.title} cover`}
              className="h-full w-full bg-cover bg-center"
              style={{
                backgroundImage:
                  `url(${JSON.stringify(
                    anime.coverImageUrl,
                  )})`,
              }}
            />
          ) : (
            <div
              aria-hidden="true"
              className="h-full w-full bg-gradient-to-br from-muted to-background"
            />
          )}
        </Link>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border bg-primary/5 px-2.5 py-1 text-[0.7rem] font-medium uppercase tracking-wide">
              {
                STATUS_LABELS[
                  entry.status
                ]
              }
            </span>

            {entry.rewatchCount >
            0 ? (
              <span className="rounded-full border px-2.5 py-1 text-[0.7rem] text-muted-foreground">
                {
                  entry.rewatchCount
                }{" "}
                {entry.rewatchCount ===
                1
                  ? "rewatch"
                  : "rewatches"}
              </span>
            ) : null}
          </div>

          <Link
            href={`/anime/${anime.slug}`}
            className="mt-2 block"
          >
            <h2 className="line-clamp-2 font-semibold leading-6 tracking-tight hover:underline sm:text-lg">
              {anime.title}
            </h2>
          </Link>

          {metadata.length >
          0 ? (
            <p className="mt-1 text-xs capitalize text-muted-foreground">
              {metadata.join(
                " · ",
              )}
            </p>
          ) : null}

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:hidden">
            <ListStats
              entry={entry}
            />
          </dl>
        </div>

        <dl className="hidden grid-cols-1 gap-4 border-l pl-5 text-sm sm:grid">
          <ListStats
            entry={entry}
          />
        </dl>
      </div>
    </article>
  )
}

function ListStats({
  entry,
}: {
  entry: AnimeListEntry
}) {
  const totalEpisodes =
    entry.anime.episodes

  return (
    <>
      <div>
        <dt className="text-xs text-muted-foreground">
          Progress
        </dt>

        <dd className="mt-1 font-medium">
          {
            entry.progressEpisodes
          }
          {totalEpisodes !== null
            ? ` / ${totalEpisodes}`
            : ""}
        </dd>
      </div>

      <div>
        <dt className="text-xs text-muted-foreground">
          Score
        </dt>

        <dd className="mt-1 font-medium">
          {entry.score !== null
            ? entry.score.toFixed(
                1,
              )
            : "—"}
        </dd>
      </div>
    </>
  )
}

export {
  AnimeListEntryCard,
}
