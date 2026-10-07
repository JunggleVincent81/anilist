import Link from "next/link"

import {
  AnimeCard,
} from "@/components/anime/anime-card"

import {
  ContentSection,
} from "@/components/layout/content-section"

import {
  PageContainer,
} from "@/components/layout/page-container"

import {
  SectionHeader,
} from "@/components/layout/section-header"

import {
  buttonVariants,
} from "@/components/ui/button"

import {
  cn,
} from "@/lib/utils"

import {
  discoverAnime,
} from "@/lib/graphql/anime"

import type {
  AnimeSeason,
} from "@/lib/graphql/anime"

import {
  formatAnimeSeason,
  getAdjacentAnimeSeason,
  getCurrentAnimeSeason,
  isAnimeSeason,
  SEASONS,
} from "@/lib/anime/season"

type SeasonPageProps = {
  searchParams:
    Promise<{
      season?:
        string | string[]
      year?:
        string | string[]
      page?:
        string | string[]
    }>
}

function firstParam(
  value:
    | string
    | string[]
    | undefined,
): string | undefined {
  return Array.isArray(value)
    ? value[0]
    : value
}

function parseYear(
  value: string | undefined,
  fallback: number,
): number {
  if (!value) {
    return fallback
  }

  const parsed =
    Number(value)

  if (
    !Number.isInteger(parsed) ||
    parsed < 1900 ||
    parsed > 2200
  ) {
    return fallback
  }

  return parsed
}

function parsePage(
  value: string | undefined,
): number {
  if (!value) {
    return 1
  }

  const parsed =
    Number(value)

  if (
    !Number.isInteger(parsed) ||
    parsed < 1
  ) {
    return 1
  }

  return parsed
}

function buildSeasonHref({
  season,
  year,
  page,
}: {
  season:
    AnimeSeason
  year:
    number
  page?: number
}): string {
  const params =
    new URLSearchParams({
      season,
      year:
        String(year),
    })

  if (
    page !== undefined &&
    page > 1
  ) {
    params.set(
      "page",
      String(page),
    )
  }

  return (
    `/season?${params.toString()}`
  )
}

export default async function SeasonPage({
  searchParams,
}: SeasonPageProps) {
  const params =
    await searchParams

  const current =
    getCurrentAnimeSeason()

  const requestedSeason =
    firstParam(
      params.season,
    )

  const season =
    isAnimeSeason(
      requestedSeason,
    )
      ? requestedSeason
      : current.season

  const year =
    parseYear(
      firstParam(
        params.year,
      ),
      current.year,
    )

  const requestedPage =
    parsePage(
      firstParam(
        params.page,
      ),
    )

  const selected = {
    season,
    year,
  }

  const previous =
    getAdjacentAnimeSeason(
      selected,
      -1,
    )

  const next =
    getAdjacentAnimeSeason(
      selected,
      1,
    )

  const discovery =
    await discoverAnime({
      seasons: [
        season,
      ],

      seasonYear:
        year,

      page:
        requestedPage,

      perPage:
        24,

      sort:
        "TITLE_ASC",
    })

  const page =
    Math.min(
      discovery.pageInfo.page,
      Math.max(
        discovery.pageInfo.pageCount,
        1,
      ),
    )

    const hasPrevious =
      page > 1

    const hasNext =
      page <
      discovery.pageInfo.pageCount

  return (
    <main>
      <PageContainer>
        <ContentSection
          spacing="lg"
        >
          <SectionHeader
            eyebrow="Seasonal"
            title={
              formatAnimeSeason(
                selected,
              )
            }
            description="Browse anime from a specific broadcast season."
          />

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/discover?season=${season}&year=${year}`}
              className={
                buttonVariants({
                  variant:
                    "outline",
                  size:
                    "sm",
                })
              }
            >
              Advanced filters
            </Link>

            <Link
              href="/schedule"
              className={
                buttonVariants({
                  variant:
                    "outline",
                  size:
                    "sm",
                })
              }
            >
              Airing schedule
            </Link>
          </div>

          <div
            className={cn(
              "flex flex-col gap-4",
              "lg:flex-row lg:items-center lg:justify-between",
            )}
          >
            <div
              className="flex flex-wrap gap-2"
            >
              <Link
                href={
                  buildSeasonHref(
                    previous,
                  )
                }
                className={
                  buttonVariants({
                    variant:
                      "outline",
                    size:
                      "sm",
                  })
                }
              >
                ←{" "}
                {formatAnimeSeason(
                  previous,
                )}
              </Link>

              <Link
                href={
                  buildSeasonHref(
                    current,
                  )
                }
                className={
                  buttonVariants({
                    variant:
                      (
                        season ===
                          current.season &&
                        year ===
                          current.year
                      )
                        ? "default"
                        : "secondary",
                    size:
                      "sm",
                  })
                }
              >
                Current season
              </Link>

              <Link
                href={
                  buildSeasonHref(
                    next,
                  )
                }
                className={
                  buttonVariants({
                    variant:
                      "outline",
                    size:
                      "sm",
                  })
                }
              >
                {formatAnimeSeason(
                  next,
                )}{" "}
                →
              </Link>
            </div>

            <p
              className="text-sm text-muted-foreground"
            >
              {
                discovery
                  .pageInfo
                  .total
              }{" "}
              anime
            </p>
          </div>

          <div
            className="flex flex-wrap gap-2"
            aria-label="Anime season"
          >
            {SEASONS.map(
              (
                seasonOption,
              ) => {
                const active =
                  seasonOption ===
                  season

                const label =
                  seasonOption
                    .charAt(0) +
                  seasonOption
                    .slice(1)
                    .toLowerCase()

                return (
                  <Link
                    key={
                      seasonOption
                    }
                    href={
                      buildSeasonHref({
                        season:
                          seasonOption,
                        year,
                      })
                    }
                    aria-current={
                      active
                        ? "page"
                        : undefined
                    }
                    className={
                      buttonVariants({
                        variant:
                          active
                            ? "default"
                            : "outline",
                        size:
                          "sm",
                      })
                    }
                  >
                    {label}
                  </Link>
                )
              },
            )}
          </div>

          {discovery.items.length >
          0 ? (
            <>
              <div
                className={cn(
                  "grid gap-x-4 gap-y-8",
                  "grid-cols-2",
                  "sm:grid-cols-3",
                  "lg:grid-cols-4",
                  "xl:grid-cols-6",
                )}
              >
                {discovery.items.map(
                  (anime) => (
                    <AnimeCard
                      key={
                        anime.id
                      }
                      anime={
                        anime
                      }
                    />
                  ),
                )}
              </div>

              {discovery
                .pageInfo
                .pageCount >
                1 && (
                <nav
                  aria-label="Season pagination"
                  className="flex items-center justify-between gap-4 border-t border-border pt-6"
                >
                  <div>
                    {hasPrevious ? (
                      <Link
                        href={
                          buildSeasonHref({
                            season,
                            year,
                            page:
                              page -
                              1,
                          })
                        }
                        className={
                          buttonVariants({
                            variant:
                              "outline",
                            size:
                              "sm",
                          })
                        }
                      >
                        ← Previous
                      </Link>
                    ) : (
                      <span />
                    )}
                  </div>

                  <p
                    className="text-sm text-muted-foreground"
                  >
                    Page{" "}
                    {
                      discovery
                        .pageInfo
                        .page
                    }{" "}
                    of{" "}
                    {
                      discovery
                        .pageInfo
                        .pageCount
                    }
                  </p>

                  <div>
                    {hasNext ? (
                      <Link
                        href={
                          buildSeasonHref({
                            season,
                            year,
                            page:
                              page +
                              1,
                          })
                        }
                        className={
                          buttonVariants({
                            variant:
                              "outline",
                            size:
                              "sm",
                          })
                        }
                      >
                        Next →
                      </Link>
                    ) : (
                      <span />
                    )}
                  </div>
                </nav>
              )}
            </>
          ) : (
            <div
              className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center"
            >
              <h2
                className="text-lg font-semibold text-foreground"
              >
                No anime found
              </h2>

              <p
                className="mt-2 text-sm text-muted-foreground"
              >
                There are no
                public catalog
                entries for{" "}
                {formatAnimeSeason(
                  selected,
                )}
                .
              </p>
            </div>
          )}
        </ContentSection>
      </PageContainer>
    </main>
  )
}