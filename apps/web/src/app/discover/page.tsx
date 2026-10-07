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
  Button,
} from "@/components/ui/button"
import {
  Input,
} from "@/components/ui/input"

import {
  discoverAnime,
} from "@/lib/graphql/anime"

import type {
  AnimeDiscoveryInput,
  AnimeDiscoverySort,
  AnimeFormat,
  AnimeReleaseStatus,
  AnimeSeason,
} from "@/lib/graphql/anime"

type DiscoverPageProps = {
  searchParams: Promise<{
    q?: string | string[]
    format?: string | string[]
    status?: string | string[]
    season?: string | string[]
    year?: string | string[]
    sort?: string | string[]
    page?: string | string[]
  }>
}

const PER_PAGE = 30

const formats:
  AnimeFormat[] = [
    "TV",
    "MOVIE",
    "OVA",
    "ONA",
    "SPECIAL",
    "MUSIC",
  ]

const statuses:
  AnimeReleaseStatus[] = [
    "UPCOMING",
    "AIRING",
    "FINISHED",
    "HIATUS",
    "CANCELLED",
  ]

const seasons:
  AnimeSeason[] = [
    "WINTER",
    "SPRING",
    "SUMMER",
    "FALL",
  ]

const sorts: Array<{
  value: AnimeDiscoverySort
  label: string
}> = [
  {
    value: "TITLE_ASC",
    label: "Title A–Z",
  },
  {
    value: "TITLE_DESC",
    label: "Title Z–A",
  },
  {
    value: "SEASON_YEAR_DESC",
    label: "Newest season",
  },
  {
    value: "SEASON_YEAR_ASC",
    label: "Oldest season",
  },
]

function firstValue(
  value:
    | string
    | string[]
    | undefined,
): string | undefined {
  if (
    Array.isArray(value)
  ) {
    return value[0]
  }

  return value
}

function parseFormat(
  value:
    | string
    | undefined,
): AnimeFormat | undefined {
  if (
    value &&
    formats.includes(
      value as AnimeFormat,
    )
  ) {
    return value as AnimeFormat
  }

  return undefined
}

function parseStatus(
  value:
    | string
    | undefined,
): AnimeReleaseStatus | undefined {
  if (
    value &&
    statuses.includes(
      value as AnimeReleaseStatus,
    )
  ) {
    return value as
      AnimeReleaseStatus
  }

  return undefined
}

function parseSeason(
  value:
    | string
    | undefined,
): AnimeSeason | undefined {
  if (
    value &&
    seasons.includes(
      value as AnimeSeason,
    )
  ) {
    return value as AnimeSeason
  }

  return undefined
}

function parseYear(
  value:
    | string
    | undefined,
): number | undefined {
  if (!value) {
    return undefined
  }

  const parsed =
    Number(value)

  if (
    !Number.isInteger(parsed) ||
    parsed < 1900 ||
    parsed > 2200
  ) {
    return undefined
  }

  return parsed
}

function parsePage(
  value:
    | string
    | undefined,
): number {
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

function parseSort(
  value:
    | string
    | undefined,
): AnimeDiscoverySort {
  const allowed =
    sorts.map(
      (item) =>
        item.value,
    )

  if (
    value &&
    allowed.includes(
      value as
        AnimeDiscoverySort,
    )
  ) {
    return value as
      AnimeDiscoverySort
  }

  return "TITLE_ASC"
}

function formatLabel(
  value: string,
): string {
  return value
    .toLowerCase()
    .replace(
      /_/g,
      " ",
    )
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    )
}

function buildDiscoverUrl(
  values: {
    search?: string
    format?: AnimeFormat
    status?: AnimeReleaseStatus
    season?: AnimeSeason
    year?: number
    sort: AnimeDiscoverySort
    page: number
  },
): string {
  const params =
    new URLSearchParams()

  if (values.search) {
    params.set(
      "q",
      values.search,
    )
  }

  if (values.format) {
    params.set(
      "format",
      values.format,
    )
  }

  if (values.status) {
    params.set(
      "status",
      values.status,
    )
  }

  if (values.season) {
    params.set(
      "season",
      values.season,
    )
  }

  if (
    values.year !==
    undefined
  ) {
    params.set(
      "year",
      String(
        values.year,
      ),
    )
  }

  if (
    values.sort !==
    "TITLE_ASC"
  ) {
    params.set(
      "sort",
      values.sort,
    )
  }

  if (
    values.page > 1
  ) {
    params.set(
      "page",
      String(
        values.page,
      ),
    )
  }

  const query =
    params.toString()

  return query
    ? `/discover?${query}`
    : "/discover"
}

export default async function DiscoverPage({
  searchParams,
}: DiscoverPageProps) {
  const params =
    await searchParams

  const search =
    firstValue(
      params.q,
    )
      ?.trim()
      .replace(
        /\s+/g,
        " ",
      )

  const format =
    parseFormat(
      firstValue(
        params.format,
      ),
    )

  const status =
    parseStatus(
      firstValue(
        params.status,
      ),
    )

  const season =
    parseSeason(
      firstValue(
        params.season,
      ),
    )

  const year =
    parseYear(
      firstValue(
        params.year,
      ),
    )

  const sort =
    parseSort(
      firstValue(
        params.sort,
      ),
    )

  const page =
    parsePage(
      firstValue(
        params.page,
      ),
    )

  const input:
    AnimeDiscoveryInput = {
      page,
      perPage:
        PER_PAGE,

      sort,
    }

  if (search) {
    input.search =
      search
  }

  if (format) {
    input.formats = [
      format,
    ]
  }

  if (status) {
    input.statuses = [
      status,
    ]
  }

  if (season) {
    input.seasons = [
      season,
    ]
  }

  if (
    year !== undefined
  ) {
    input.seasonYear =
      year
  }

  const result =
    await discoverAnime(
      input,
    )

  const previousHref =
    buildDiscoverUrl({
      search,
      format,
      status,
      season,
      year,
      sort,

      page:
        Math.max(
          1,
          page - 1,
        ),
    })

  const nextHref =
    buildDiscoverUrl({
      search,
      format,
      status,
      season,
      year,
      sort,

      page:
        page + 1,
    })

  return (
    <main>
      <PageContainer>
        <ContentSection spacing="lg">
          <SectionHeader
            eyebrow="Discover"
            title="Find your next anime."
            description="Search and narrow the catalog by format, release status, season and year."
          />

          <div className="flex flex-wrap gap-2">
            <Link
              href="/season"
              className="inline-flex h-8 items-center rounded-lg border px-3 text-sm font-medium transition hover:bg-muted"
            >
              Browse seasonal
            </Link>

            <Link
              href="/schedule"
              className="inline-flex h-8 items-center rounded-lg border px-3 text-sm font-medium transition hover:bg-muted"
            >
              Airing schedule
            </Link>
          </div>

          <form
            method="get"
            className="grid gap-3 rounded-xl border border-border/80 bg-card/50 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[minmax(0,1fr)_140px_140px_140px_120px_170px_auto]"
          >
            <Input
              type="search"
              name="q"
              defaultValue={
                search ?? ""
              }
              placeholder="Search anime..."
              aria-label="Search anime"
              className="sm:col-span-2 lg:col-span-3 xl:col-span-1"
            />

            <select
              name="format"
              defaultValue={
                format ?? ""
              }
              aria-label="Anime format"
              className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/50"
            >
              <option value="">
                All formats
              </option>

              {formats.map(
                (value) => (
                  <option
                    key={
                      value
                    }
                    value={
                      value
                    }
                  >
                    {
                      formatLabel(
                        value,
                      )
                    }
                  </option>
                ),
              )}
            </select>

            <select
              name="status"
              defaultValue={
                status ?? ""
              }
              aria-label="Release status"
              className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/50"
            >
              <option value="">
                All statuses
              </option>

              {statuses.map(
                (value) => (
                  <option
                    key={
                      value
                    }
                    value={
                      value
                    }
                  >
                    {
                      formatLabel(
                        value,
                      )
                    }
                  </option>
                ),
              )}
            </select>

            <select
              name="season"
              defaultValue={
                season ?? ""
              }
              aria-label="Anime season"
              className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/50"
            >
              <option value="">
                All seasons
              </option>

              {seasons.map(
                (value) => (
                  <option
                    key={
                      value
                    }
                    value={
                      value
                    }
                  >
                    {
                      formatLabel(
                        value,
                      )
                    }
                  </option>
                ),
              )}
            </select>

            <Input
              type="number"
              name="year"
              min={1900}
              max={2200}
              defaultValue={
                year ?? ""
              }
              placeholder="Year"
              aria-label="Season year"
            />

            <select
              name="sort"
              defaultValue={
                sort
              }
              aria-label="Sort anime"
              className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/50"
            >
              {sorts.map(
                (item) => (
                  <option
                    key={
                      item.value
                    }
                    value={
                      item.value
                    }
                  >
                    {item.label}
                  </option>
                ),
              )}
            </select>

            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1"
              >
                Apply
              </Button>

              <Link
                href="/discover"
                className="inline-flex h-8 items-center justify-center rounded-lg border border-border px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                Reset
              </Link>
            </div>
          </form>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Anime
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {
                  result
                    .pageInfo
                    .total
                    .toLocaleString()
                }{" "}
                titles found
              </p>
            </div>

            {result.pageInfo
              .pageCount >
            0 ? (
              <p className="text-sm text-muted-foreground">
                Page{" "}
                {
                  result
                    .pageInfo
                    .page
                }{" "}
                of{" "}
                {
                  result
                    .pageInfo
                    .pageCount
                }
              </p>
            ) : null}
          </div>

          {result.items.length >
          0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {result.items.map(
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
          ) : (
            <div className="rounded-xl border border-dashed border-border py-16 text-center">
              <h2 className="text-base font-semibold">
                No anime found
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Try a different search term or remove some filters.
              </p>

              <Link
                href="/discover"
                className="mt-5 inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/80"
              >
                Clear filters
              </Link>
            </div>
          )}

          {result.pageInfo
            .pageCount >
          1 ? (
            <nav
              aria-label="Anime pagination"
              className="flex items-center justify-between gap-4 border-t border-border/70 pt-6"
            >
              {result.pageInfo
                .hasPreviousPage ? (
                <Link
                  href={
                    previousHref
                  }
                  className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-sm font-medium transition hover:bg-muted"
                >
                  ← Previous
                </Link>
              ) : (
                <span className="inline-flex h-8 cursor-not-allowed items-center rounded-lg border border-border px-3 text-sm font-medium text-muted-foreground opacity-50">
                  ← Previous
                </span>
              )}

              <span className="text-sm text-muted-foreground">
                {
                  result
                    .pageInfo
                    .page
                }
                {" / "}
                {
                  result
                    .pageInfo
                    .pageCount
                }
              </span>

              {result.pageInfo
                .hasNextPage ? (
                <Link
                  href={
                    nextHref
                  }
                  className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-sm font-medium transition hover:bg-muted"
                >
                  Next →
                </Link>
              ) : (
                <span className="inline-flex h-8 cursor-not-allowed items-center rounded-lg border border-border px-3 text-sm font-medium text-muted-foreground opacity-50">
                  Next →
                </span>
              )}
            </nav>
          ) : null}
        </ContentSection>
      </PageContainer>
    </main>
  )
}
