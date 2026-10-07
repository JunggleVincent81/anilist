import Link from "next/link"

import type {
  AnimeSummary,
} from "@/lib/graphql/anime"

type AnimeCardProps = {
  anime: AnimeSummary
}

function getAnimeMeta(
  anime: AnimeSummary,
): string {
  const values: string[] = []

  values.push(
    anime.format,
  )

  if (
    anime.season &&
    anime.seasonYear
  ) {
    values.push(
      `${anime.season} ${anime.seasonYear}`,
    )
  } else if (
    anime.seasonYear
  ) {
    values.push(
      String(
        anime.seasonYear,
      ),
    )
  }

  if (
    anime.episodes
  ) {
    values.push(
      `${anime.episodes} ep`,
    )
  }

  return values.join(
    " · ",
  )
}

function AnimeCard({
  anime,
}: AnimeCardProps) {
  const backgroundStyle =
    anime.coverImageUrl
      ? {
          backgroundImage:
            `url(${JSON.stringify(
              anime.coverImageUrl,
            )})`,
        }
      : undefined

  return (
    <Link
      href={
        `/anime/${anime.slug}`
      }
      className="group min-w-0"
    >
      <div
        className="relative aspect-[2/3] overflow-hidden rounded-xl border border-border/80 bg-muted bg-cover bg-center shadow-sm transition duration-200 group-hover:-translate-y-0.5 group-hover:border-foreground/20 group-hover:shadow-lg"
        style={
          backgroundStyle
        }
      >
        {!anime.coverImageUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-background p-6 text-center">
            <span className="font-heading text-sm font-semibold text-muted-foreground">
              {anime.title}
            </span>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

        <div className="absolute top-2 left-2 rounded-md bg-background/85 px-2 py-1 text-[0.6875rem] font-semibold tracking-wide backdrop-blur">
          {anime.format}
        </div>

        <div className="absolute right-2 bottom-2 rounded-md bg-black/60 px-2 py-1 text-[0.6875rem] font-medium text-white backdrop-blur">
          {anime.status}
        </div>
      </div>

      <div className="mt-3 min-w-0">
        <h2 className="truncate font-heading text-sm font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
          {anime.title}
        </h2>

        <p className="mt-1 truncate text-xs text-muted-foreground">
          {getAnimeMeta(
            anime,
          )}
        </p>
      </div>
    </Link>
  )
}

export {
  AnimeCard,
}