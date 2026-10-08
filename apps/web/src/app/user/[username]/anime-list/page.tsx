import Link from "next/link"
import { notFound } from "next/navigation"

import {
  AnimeListEntries,
} from "@/components/anime/anime-list-entries"
import {
  ContentSection,
} from "@/components/layout/content-section"
import {
  PageContainer,
} from "@/components/layout/page-container"
import {
  Button,
} from "@/components/ui/button"
import {
  getAnimeList,
} from "@/lib/graphql/tracking"

import type {
  AnimeListStatus,
} from "@/lib/graphql/tracking"

type AnimeListPageProps = {
  params: Promise<{
    username: string
  }>

  searchParams: Promise<{
    status?: string
    page?: string
  }>
}

const PER_PAGE = 30

const STATUS_OPTIONS:
  Array<{
    value:
      | AnimeListStatus
      | null
    label: string
  }> = [
    {
      value: null,
      label: "All",
    },
    {
      value: "WATCHING",
      label: "Watching",
    },
    {
      value: "PLANNING",
      label: "Planning",
    },
    {
      value: "COMPLETED",
      label: "Completed",
    },
    {
      value: "PAUSED",
      label: "Paused",
    },
    {
      value: "DROPPED",
      label: "Dropped",
    },
    {
      value: "REWATCHING",
      label: "Rewatching",
    },
  ]

const VALID_STATUSES =
  new Set<AnimeListStatus>(
    STATUS_OPTIONS
      .map(
        (option) =>
          option.value,
      )
      .filter(
        (
          value,
        ): value is AnimeListStatus =>
          value !== null,
      ),
  )

function parseStatus(
  value: string | undefined,
): AnimeListStatus | undefined {
  if (!value) {
    return undefined
  }

  return VALID_STATUSES.has(
    value as AnimeListStatus,
  )
    ? (
        value as
          AnimeListStatus
      )
    : undefined
}

function parsePage(
  value: string | undefined,
): number {
  if (!value) {
    return 1
  }

  const page =
    Number.parseInt(
      value,
      10,
    )

  if (
    !Number.isInteger(page) ||
    page < 1
  ) {
    return 1
  }

  return page
}

function buildHref(
  username: string,
  status:
    | AnimeListStatus
    | undefined,
  page = 1,
): string {
  const params =
    new URLSearchParams()

  if (status) {
    params.set(
      "status",
      status,
    )
  }

  if (page > 1) {
    params.set(
      "page",
      String(page),
    )
  }

  const query =
    params.toString()

  return `/user/${username}/anime-list${
    query
      ? `?${query}`
      : ""
  }`
}

export default async function AnimeListPage({
  params,
  searchParams,
}: AnimeListPageProps) {
  const [
    {
      username,
    },
    query,
  ] =
    await Promise.all([
      params,
      searchParams,
    ])

  const status =
    parseStatus(
      query.status,
    )

  const page =
    parsePage(
      query.page,
    )

  const list =
    await getAnimeList({
      username,
      status,
      page,
      perPage:
        PER_PAGE,
    })

  if (!list) {
    notFound()
  }

  return (
    <main>
      <PageContainer>
        <ContentSection spacing="lg">
          <div className="mx-auto w-full max-w-5xl">
            <header className="space-y-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Anime List
                </p>

                <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
                  @{list.username}
                </h1>
              </div>

              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Anime this user has
                tracked, including
                progress, status and
                personal scores.
              </p>
            </header>

            <nav
              aria-label="Anime list status"
              className="mt-8 flex gap-2 overflow-x-auto pb-2"
            >
              {STATUS_OPTIONS.map(
                (option) => {
                  const active =
                    option.value ===
                    (
                      status ??
                      null
                    )

                  return (
                    <Button
                      nativeButton={false}
                      key={
                        option.value ??
                        "ALL"
                      }
                      size="sm"
                      className="shrink-0"
                      variant={
                        active
                          ? "default"
                          : "outline"
                      }
                      render={
                        <Link
                          href={buildHref(
                            list.username,
                            option.value ??
                              undefined,
                          )}
                          aria-current={
                            active
                              ? "page"
                              : undefined
                          }
                        />
                      }
                    >
                      {
                        option.label
                      }
                    </Button>
                  )
                },
              )}
            </nav>

            <div className="mt-4 flex items-center justify-between border-y py-3 text-sm text-muted-foreground">
              <p>
                {
                  list.pageInfo
                    .total
                }{" "}
                {list.pageInfo
                  .total === 1
                  ? "anime"
                  : "anime"}
              </p>

              {list.pageInfo
                .pageCount >
              1 ? (
                <p>
                  Page{" "}
                  {
                    list.pageInfo
                      .page
                  }{" "}
                  of{" "}
                  {
                    list.pageInfo
                      .pageCount
                  }
                </p>
              ) : null}
            </div>

            {list.entries.length >
            0 ? (
              <div className="mt-6">
                <AnimeListEntries
                  key={list.entries
                    .map(
                      (entry) =>
                        `${entry.id}:${entry.updatedAt}`,
                    )
                    .join("|")}
                  username={
                    list.username
                  }
                  initialEntries={
                    list.entries
                  }
                />
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed px-6 py-16 text-center">
                <p className="font-medium">
                  No anime here yet.
                </p>

                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                  {status
                    ? `There are no anime with the ${STATUS_OPTIONS.find(
                        (
                          option,
                        ) =>
                          option.value ===
                          status,
                      )?.label.toLowerCase()} status.`
                    : "This user has not added any anime to their list yet."}
                </p>
              </div>
            )}

            {list.pageInfo
              .pageCount >
            1 ? (
              <nav
                aria-label="Anime list pagination"
                className="mt-8 flex items-center justify-between gap-4 border-t pt-6"
              >
                {list.pageInfo
                  .hasPreviousPage ? (
                  <Button
                    nativeButton={false}
                    variant="outline"
                    render={
                      <Link
                        href={buildHref(
                          list.username,
                          status,
                          page - 1,
                        )}
                      />
                    }
                  >
                    Previous
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    disabled
                  >
                    Previous
                  </Button>
                )}

                <span className="text-sm text-muted-foreground">
                  {
                    list.pageInfo
                      .page
                  }{" "}
                  /{" "}
                  {
                    list.pageInfo
                      .pageCount
                  }
                </span>

                {list.pageInfo
                  .hasNextPage ? (
                  <Button
                    nativeButton={false}
                    variant="outline"
                    render={
                      <Link
                        href={buildHref(
                          list.username,
                          status,
                          page + 1,
                        )}
                      />
                    }
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    disabled
                  >
                    Next
                  </Button>
                )}
              </nav>
            ) : null}
          </div>
        </ContentSection>
      </PageContainer>
    </main>
  )
}
