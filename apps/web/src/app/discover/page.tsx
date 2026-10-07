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
} from "@/lib/graphql/anime"

type DiscoverPageProps = {
  searchParams: Promise<
    Record<
      string,
      string |
      string[] |
      undefined
    >
  >
}

const PER_PAGE = 24

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
    "AIRING",
    "UPCOMING",
    "FINISHED",
    "HIATUS",
    "CANCELLED",
  ]

const sorts: Array<{
  value:
    AnimeDiscoverySort

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
    value:
      "START_DATE_DESC",

    label:
      "Newest release",
  },

  {
    value:
      "START_DATE_ASC",

    label:
      "Oldest release",
  },

  {
    value:
      "SEASON_YEAR_DESC",

    label:
      "Newest season",
  },

  {
    value:
      "SEASON_YEAR_ASC",

    label:
      "Oldest season",
  },
]

function firstValue(
  value:
    string |
    string[] |
    undefined,
): string | undefined {
  if (
    Array.isArray(value)
  ) {
    return value[0]
  }

  return value
}

function parsePage(
  value:
    string |
    undefined,
): number {
  if (!value) {
    return 1
  }

  const parsed =
    Number.parseInt(
      value,
      10,
    )

  if (
    !Number.isInteger(
      parsed,
    ) ||
    parsed < 1
  ) {
    return 1
  }

  return parsed
}

function parseFormat(
  value:
    string |
    undefined,
): AnimeFormat | undefined {
  if (!value) {
    return undefined
  }

  return formats.includes(
    value as AnimeFormat,
  )
    ? (
        value as
          AnimeFormat
      )
    : undefined
}

function parseStatus(
  value:
    string |
    undefined,
):
  | AnimeReleaseStatus
  | undefined {
  if (!value) {
    return undefined
  }

  return statuses.includes(
    value as
      AnimeReleaseStatus,
  )
    ? (
        value as
          AnimeReleaseStatus
      )
    : undefined
}

function parseSort(
  value:
    string |
    undefined,
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

function buildDiscoverUrl(
  values: {
    search?:
      string

    format?:
      AnimeFormat

    status?:
      AnimeReleaseStatus

    sort:
      AnimeDiscoverySort

    page:
      number
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

  const result =
    await discoverAnime(
      input,
    )

  const previousHref =
    buildDiscoverUrl({
      search,
      format,
      status,
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
            description="Search and explore anime from the platform catalog."
          />

          <form
            method="get"
            className="grid gap-3 rounded-xl border border-border/80 bg-card/50 p-4 md:grid-cols-[minmax(0,1fr)_160px_160px_180px_auto]"
          >
            <Input
              type="search"
              name="q"
              defaultValue={
                search ?? ""
              }
              placeholder="Search anime..."
              aria-label="Search anime"
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
                    {value}
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
                    {value}
                  </option>
                ),
              )}
            </select>

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
              <h2 className="font-heading text-lg font-semibold tracking-tight">
                Anime
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {result.pageInfo.total.toLocaleString()}
                {" "}
                titles found
              </p>
            </div>

            {result.pageInfo.pageCount > 0 && (
              <p className="text-sm text-muted-foreground">
                Page{" "}
                {
                  result.pageInfo.page
                }
                {" "}
                of{" "}
                {
                  result.pageInfo.pageCount
                }
              </p>
            )}
          </div>

          {result.items.length > 0 ? (
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
              <h2 className="font-heading text-base font-semibold">
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

          {result.pageInfo.pageCount > 1 && (
            <nav
              aria-label="Anime pagination"
              className="flex items-center justify-between border-t border-border/70 pt-6"
            >
              {result.pageInfo.hasPreviousPage ? (
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
                  result.pageInfo.page
                }
                {" / "}
                {
                  result.pageInfo.pageCount
                }
              </span>

              {result.pageInfo.hasNextPage ? (
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
          )}
        </ContentSection>
      </PageContainer>
    </main>
  )
}