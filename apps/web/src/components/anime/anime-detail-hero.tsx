import { AnimeFavoriteToggle } from "@/components/anime/anime-favorite-toggle"
import { AnimeTrackingControl } from "@/components/anime/anime-tracking-control"
import type {
  AnimeDetail,
} from "@/lib/graphql/anime"

import {
  formatAnimeEnumLabel,
  formatAnimeSeason,
} from "@/lib/anime/display"

type AnimeDetailHeroProps = {
  anime: AnimeDetail
}

function getSupportingTitles(
  anime: AnimeDetail,
): string[] {
  const canonical =
    anime.title
      .trim()
      .toLocaleLowerCase()

  const candidates = [
    anime.titleEnglish,
    anime.titleRomaji,
    anime.titleNative,
  ]

  return [
    ...new Set(
      candidates
        .filter(
          (
            value,
          ): value is string =>
            typeof value === "string" &&
            value.trim().length > 0 &&
            value
              .trim()
              .toLocaleLowerCase() !==
              canonical,
        )
        .map(
          (value) =>
            value.trim(),
        ),
    ),
  ]
}

export function AnimeDetailHero({
  anime,
}: AnimeDetailHeroProps) {
  const hasBanner =
    Boolean(
      anime.bannerImageUrl,
    )

  const supportingTitles =
    getSupportingTitles(
      anime,
    )

  const season =
    formatAnimeSeason(
      anime.season,
      anime.seasonYear,
    )

  const metadata = [
    formatAnimeEnumLabel(
      anime.format,
    ),
    formatAnimeEnumLabel(
      anime.status,
    ),
    season,
    anime.episodes !== null
      ? `${anime.episodes} ${
          anime.episodes === 1
            ? "episode"
            : "episodes"
        }`
      : null,
    anime.durationMinutes !== null
      ? `${anime.durationMinutes} min`
      : null,
  ].filter(
    (
      value,
    ): value is string =>
      Boolean(value),
  )

  return (
    <section
      aria-labelledby="anime-title"
      className="relative overflow-hidden rounded-2xl border bg-card"
    >
      {hasBanner ? (
        <div className="absolute inset-x-0 top-0 h-56 md:h-72">
          <div
            role="img"
            aria-label={`${anime.title} banner`}
            className="h-full w-full bg-cover bg-center"
            style={{
              backgroundImage:
                `url(${JSON.stringify(
                  anime.bannerImageUrl,
                )})`,
            }}
          />

          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/55 to-card"
          />
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-muted/35 via-card to-card"
        />
      )}

      <div
        className={
          hasBanner
            ? "relative grid gap-6 px-5 pb-6 pt-28 sm:px-6 md:grid-cols-[11rem_minmax(0,1fr)] md:items-end md:gap-8 md:pt-40 lg:px-8 lg:pb-8 lg:pt-44"
            : "relative grid gap-6 px-5 py-6 sm:px-6 md:grid-cols-[11rem_minmax(0,1fr)] md:items-center md:gap-8 lg:px-8 lg:py-8"
        }
      >
        <div className="mx-auto w-36 md:mx-0 md:w-44">
          <div className="aspect-[2/3] overflow-hidden rounded-xl border bg-muted shadow-lg">
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
              <div className="flex h-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
                Cover unavailable
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 space-y-4 text-center md:text-left">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Anime
            </p>

            <h1
              id="anime-title"
              className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl"
            >
              {anime.title}
            </h1>

            {supportingTitles.length >
            0 ? (
              <div className="space-y-1">
                {supportingTitles
                  .slice(
                    0,
                    2,
                  )
                  .map(
                    (title) => (
                      <p
                        key={title}
                        className="text-sm text-muted-foreground sm:text-base"
                      >
                        {title}
                      </p>
                    ),
                  )}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap justify-center gap-2 md:justify-start">
            {metadata.map(
              (item) => (
                <span
                  key={item}
                  className="rounded-full border bg-background/70 px-3 py-1 text-xs font-medium backdrop-blur"
                >
                  {item}
                </span>
              ),
            )}

            {anime.isAdult ===
            true ? (
              <span className="rounded-full border bg-background/70 px-3 py-1 text-xs font-medium backdrop-blur">
                18+
              </span>
            ) : null}
          </div>

          <div className="mx-auto w-full max-w-sm space-y-2 md:mx-0">
            <AnimeTrackingControl
              animeId={anime.id}
              episodes={anime.episodes}
            />

            <AnimeFavoriteToggle
              animeId={anime.id}
            />
          </div>
        </div>
      </div>
    </section>
  )
}