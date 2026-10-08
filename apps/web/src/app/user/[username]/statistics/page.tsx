import Link from "next/link"
import {
  notFound,
} from "next/navigation"

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
  getUserStatistics,
} from "@/lib/graphql/statistics"

type UserStatisticsPageProps = {
  params: Promise<{
    username: string
  }>
}

type StatisticCardProps = {
  label: string
  value:
    | string
    | number
  description?: string
}

function StatisticCard({
  label,
  value,
  description,
}: StatisticCardProps) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold tracking-tight">
        {value}
      </p>

      {description ? (
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  )
}

function formatMeanScore(
  value: number | null,
): string {
  if (value === null) {
    return "—"
  }

  return value
    .toFixed(2)
    .replace(
      /\.?0+$/,
      "",
    )
}

export default async function UserStatisticsPage({
  params,
}: UserStatisticsPageProps) {
  const {
    username,
  } = await params

  const statistics =
    await getUserStatistics(
      username,
    )

  if (!statistics) {
    notFound()
  }

  return (
    <main>
      <PageContainer>
        <ContentSection spacing="lg">
          <div className="mx-auto w-full max-w-6xl">
            <div className="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Statistics
                </p>

                <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
                  @{statistics.username}
                  &apos;s journey
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  A snapshot derived from the
                  current anime list, scores,
                  rewatches, favorites, and
                  tracked genres.
                </p>
              </div>

              <Button
                nativeButton={false}
                variant="outline"
                render={
                  <Link
                    href={`/user/${statistics.username}`}
                  />
                }
              >
                View Profile
              </Button>
            </div>

            <section
              aria-labelledby="statistics-overview"
              className="mt-8"
            >
              <h2
                id="statistics-overview"
                className="text-xl font-semibold tracking-tight"
              >
                Overview
              </h2>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatisticCard
                  label="Tracked Anime"
                  value={
                    statistics.totalTracked
                  }
                />

                <StatisticCard
                  label="Episodes Logged"
                  value={
                    statistics.episodesLogged
                  }
                  description="Current episode progress, not lifetime viewing history."
                />

                <StatisticCard
                  label="Rewatches"
                  value={
                    statistics.totalRewatches
                  }
                />

                <StatisticCard
                  label="Favorites"
                  value={
                    statistics.favoriteAnimeCount
                  }
                />
              </div>
            </section>

            <section
              aria-labelledby="statistics-status"
              className="mt-10"
            >
              <h2
                id="statistics-status"
                className="text-xl font-semibold tracking-tight"
              >
                List Status
              </h2>

              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                <StatisticCard
                  label="Watching"
                  value={
                    statistics.watching
                  }
                />

                <StatisticCard
                  label="Completed"
                  value={
                    statistics.completed
                  }
                />

                <StatisticCard
                  label="Planning"
                  value={
                    statistics.planning
                  }
                />

                <StatisticCard
                  label="Paused"
                  value={
                    statistics.paused
                  }
                />

                <StatisticCard
                  label="Dropped"
                  value={
                    statistics.dropped
                  }
                />

                <StatisticCard
                  label="Rewatching"
                  value={
                    statistics.rewatching
                  }
                />
              </div>
            </section>

            <section
              aria-labelledby="statistics-scoring"
              className="mt-10"
            >
              <h2
                id="statistics-scoring"
                className="text-xl font-semibold tracking-tight"
              >
                Scoring
              </h2>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <StatisticCard
                  label="Mean Score"
                  value={
                    formatMeanScore(
                      statistics.meanScore,
                    )
                  }
                  description="Average of anime that currently have a score."
                />

                <StatisticCard
                  label="Scored Anime"
                  value={
                    statistics.scoredAnime
                  }
                />
              </div>
            </section>

            <section
              aria-labelledby="statistics-genres"
              className="mt-10"
            >
              <div>
                <h2
                  id="statistics-genres"
                  className="text-xl font-semibold tracking-tight"
                >
                  Top Genres
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Genres appearing most often
                  across currently tracked anime.
                </p>
              </div>

              {statistics.topGenres.length >
              0 ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {statistics.topGenres.map(
                    (
                      genre,
                      index,
                    ) => (
                      <div
                        key={
                          genre.id
                        }
                        className="flex items-center justify-between gap-4 rounded-xl border bg-card p-4"
                      >
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">
                            #{index + 1}
                          </p>

                          <p className="truncate font-medium">
                            {genre.name}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-xl font-semibold">
                            {genre.count}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            anime
                          </p>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed px-6 py-12 text-center">
                  <p className="font-medium">
                    No genre statistics yet.
                  </p>

                  <p className="mt-2 text-sm text-muted-foreground">
                    Genre insights will appear
                    after anime with genre data
                    are added to the list.
                  </p>
                </div>
              )}
            </section>
          </div>
        </ContentSection>
      </PageContainer>
    </main>
  )
}
