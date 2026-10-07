import type {
  AnimeDataProvider,
  AnimeDetail,
  AnimeTitleType,
} from "@/lib/graphql/anime"

type AnimeDetailMetadataProps = {
  anime: AnimeDetail
}

const PROVIDER_LABELS: Record<
  AnimeDataProvider,
  string
> = {
  MAL: "MyAnimeList",
  ANILIST: "AniList",
  ANIDB: "AniDB",
  KITSU: "Kitsu",
  ANIME_PLANET: "Anime-Planet",
  LIVECHART: "LiveChart",
  ANN: "Anime News Network",
  TMDB: "TMDB",
  IMDB: "IMDb",
  OTHER: "Other",
}

const TITLE_TYPE_LABELS: Record<
  AnimeTitleType,
  string
> = {
  ROMAJI: "Romaji",
  ENGLISH: "English",
  NATIVE: "Native",
  SYNONYM: "Synonym",
}

function formatDate(
  value: string | null,
): string | null {
  if (!value) {
    return null
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null
  }

  return new Intl.DateTimeFormat(
    "en",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    },
  ).format(date)
}

function isSafeExternalUrl(
  value: string | null,
): value is string {
  if (!value) {
    return false
  }

  try {
    const url =
      new URL(value)

    return (
      url.protocol === "https:" ||
      url.protocol === "http:"
    )
  } catch {
    return false
  }
}

function looksLikeMojibake(
  value: string,
): boolean {
  return /[ÃÂâ€™œžƒ]/.test(
    value,
  )
}

function getDisplayTitles(
  anime: AnimeDetail,
) {
  const canonical =
    anime.title
      .trim()
      .toLocaleLowerCase()

  const seen =
    new Set<string>()

  return anime.titles.filter(
    (title) => {
      const value =
        title.value.trim()

      if (!value) {
        return false
      }

      if (
        looksLikeMojibake(
          value,
        )
      ) {
        return false
      }

      const normalized =
        value.toLocaleLowerCase()

      if (
        normalized === canonical
      ) {
        return false
      }

      if (
        seen.has(
          normalized,
        )
      ) {
        return false
      }

      seen.add(
        normalized,
      )

      return true
    },
  )
}

export function AnimeDetailMetadata({
  anime,
}: AnimeDetailMetadataProps) {
  const startDate =
    formatDate(
      anime.startDate,
    )

  const endDate =
    formatDate(
      anime.endDate,
    )

  const alternateTitles =
    getDisplayTitles(
      anime,
    )

  const hasDates =
    Boolean(
      startDate ||
      endDate,
    )

  const hasTitles =
    alternateTitles.length > 0

  const hasExternalIds =
    anime.externalIds.length > 0

  if (
    !hasDates &&
    !hasTitles &&
    !hasExternalIds
  ) {
    return null
  }

  return (
    <div className="space-y-10">
      {hasDates ? (
        <section
          aria-labelledby="anime-release"
          className="space-y-4"
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Release
            </p>

            <h2
              id="anime-release"
              className="mt-1 text-2xl font-semibold tracking-tight"
            >
              Release Information
            </h2>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            {startDate ? (
              <div className="rounded-xl border bg-card p-4">
                <dt className="text-xs text-muted-foreground">
                  Start date
                </dt>

                <dd className="mt-1 font-medium">
                  {startDate}
                </dd>
              </div>
            ) : null}

            {endDate ? (
              <div className="rounded-xl border bg-card p-4">
                <dt className="text-xs text-muted-foreground">
                  End date
                </dt>

                <dd className="mt-1 font-medium">
                  {endDate}
                </dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}

      {hasTitles ? (
        <section
          aria-labelledby="anime-titles"
          className="space-y-4"
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Names
            </p>

            <h2
              id="anime-titles"
              className="mt-1 text-2xl font-semibold tracking-tight"
            >
              Alternative Titles
            </h2>
          </div>

          <div className="overflow-hidden rounded-xl border">
            <dl className="divide-y">
              {alternateTitles.map(
                (title) => (
                  <div
                    key={title.id}
                    className="grid gap-1 px-4 py-3 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4"
                  >
                    <dt className="text-xs text-muted-foreground sm:text-sm">
                      {
                        TITLE_TYPE_LABELS[
                          title.type
                        ]
                      }
                    </dt>

                    <dd className="min-w-0 break-words text-sm">
                      {title.value}

                      {title.languageCode ? (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (
                          {
                            title.languageCode
                          }
                          )
                        </span>
                      ) : null}
                    </dd>
                  </div>
                ),
              )}
            </dl>
          </div>
        </section>
      ) : null}

      {hasExternalIds ? (
        <section
          aria-labelledby="anime-external"
          className="space-y-4"
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              References
            </p>

            <h2
              id="anime-external"
              className="mt-1 text-2xl font-semibold tracking-tight"
            >
              External Links
            </h2>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {anime.externalIds.map(
              (
                external,
                index,
              ) => {
                const label =
                  PROVIDER_LABELS[
                    external.provider
                  ]

                const key =
                  `${external.provider}-${external.externalId}-${index}`

                if (
                  isSafeExternalUrl(
                    external.sourceUrl,
                  )
                ) {
                  return (
                    <a
                      key={key}
                      href={
                        external.sourceUrl
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group rounded-xl border bg-card p-4 transition-colors hover:bg-muted/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium">
                            {label}
                          </p>

                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {
                              external.externalId
                            }
                          </p>
                        </div>

                        <span
                          aria-hidden="true"
                          className="text-muted-foreground transition-transform group-hover:translate-x-0.5"
                        >
                          ↗
                        </span>
                      </div>
                    </a>
                  )
                }

                return (
                  <div
                    key={key}
                    className="rounded-xl border bg-card p-4"
                  >
                    <p className="font-medium">
                      {label}
                    </p>

                    <p className="mt-1 break-all text-xs text-muted-foreground">
                      {
                        external.externalId
                      }
                    </p>
                  </div>
                )
              },
            )}
          </div>
        </section>
      ) : null}
    </div>
  )
}