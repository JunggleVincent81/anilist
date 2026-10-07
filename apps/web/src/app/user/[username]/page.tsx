import Link from "next/link"
import {
  notFound,
} from "next/navigation"

import {
  AnimeFavoritesGrid,
} from "@/components/anime/anime-favorites-grid"
import {
  ContentSection,
} from "@/components/layout/content-section"
import {
  PageContainer,
} from "@/components/layout/page-container"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Badge,
} from "@/components/ui/badge"
import {
  Button,
} from "@/components/ui/button"
import {
  getAnimeFavorites,
} from "@/lib/graphql/favorites"
import {
  getUserStatistics,
} from "@/lib/graphql/statistics"
import {
  getUserProfile,
} from "@/lib/graphql/users"

type UserProfilePageProps = {
  params: Promise<{
    username: string
  }>
}

type OverviewStatisticProps = {
  label: string
  value:
    | string
    | number
}

function OverviewStatistic({
  label,
  value,
}: OverviewStatisticProps) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold tracking-tight">
        {value}
      </p>
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

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const {
    username,
  } = await params

  const profile =
    await getUserProfile(
      username,
    )

  if (!profile) {
    notFound()
  }

  const [
    favorites,
    statistics,
  ] =
    await Promise.all([
      getAnimeFavorites(
        profile.username,
      ),

      getUserStatistics(
        profile.username,
      ),
    ])

  if (
    !favorites ||
    !statistics
  ) {
    notFound()
  }

  const accountName =
    profile.displayName ??
    profile.username

  const fallback =
    accountName
      .slice(
        0,
        1,
      )
      .toUpperCase()

  const joinedAt =
    new Intl.DateTimeFormat(
      "en",
      {
        month: "long",
        year: "numeric",
      },
    ).format(
      new Date(
        profile.createdAt,
      ),
    )

  const favoritePreview =
    favorites.items.slice(
      0,
      5,
    )

  const genrePreview =
    statistics.topGenres.slice(
      0,
      5,
    )

  return (
    <main>
      <PageContainer>
        <ContentSection spacing="lg">
          <div className="mx-auto w-full max-w-6xl">
            <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <Avatar className="size-24">
                  {profile.avatarUrl ? (
                    <AvatarImage
                      src={
                        profile.avatarUrl
                      }
                      alt=""
                    />
                  ) : null}

                  <AvatarFallback className="text-2xl">
                    {fallback}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                      {accountName}
                    </h1>

                    {profile.role !==
                    "USER" ? (
                      <Badge variant="secondary">
                        {profile.role}
                      </Badge>
                    ) : null}
                  </div>

                  <p className="mt-1 text-sm text-muted-foreground">
                    @{profile.username}
                  </p>

                  <p className="mt-5 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-foreground/90">
                    {profile.bio ??
                      "No bio yet."}
                  </p>

                  <p className="mt-5 text-xs text-muted-foreground">
                    Joined {joinedAt}
                  </p>
                </div>
              </div>
            </section>

            <nav
              aria-label="Profile sections"
              className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
            >
              <Button
                variant="outline"
                render={
                  <Link
                    href={`/user/${profile.username}/anime-list`}
                  />
                }
              >
                Anime List
              </Button>

              <Button
                variant="outline"
                render={
                  <Link
                    href={`/user/${profile.username}/favorites`}
                  />
                }
              >
                Favorites
              </Button>

              <Button
                variant="outline"
                render={
                  <Link
                    href={`/user/${profile.username}/statistics`}
                  />
                }
              >
                Statistics
              </Button>

              <Button
                variant="outline"
                disabled
              >
                Achievements
              </Button>
            </nav>

            <section
              aria-labelledby="profile-journey"
              className="mt-10"
            >
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Journey
                  </p>

                  <h2
                    id="profile-journey"
                    className="mt-1 text-2xl font-semibold tracking-tight"
                  >
                    Anime snapshot
                  </h2>
                </div>

                <Link
                  href={`/user/${profile.username}/statistics`}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  View statistics →
                </Link>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <OverviewStatistic
                  label="Tracked Anime"
                  value={
                    statistics.totalTracked
                  }
                />

                <OverviewStatistic
                  label="Completed"
                  value={
                    statistics.completed
                  }
                />

                <OverviewStatistic
                  label="Episodes Logged"
                  value={
                    statistics.episodesLogged
                  }
                />

                <OverviewStatistic
                  label="Mean Score"
                  value={
                    formatMeanScore(
                      statistics.meanScore,
                    )
                  }
                />
              </div>
            </section>

            <section
              aria-labelledby="profile-favorites"
              className="mt-12"
            >
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Collection
                  </p>

                  <h2
                    id="profile-favorites"
                    className="mt-1 text-2xl font-semibold tracking-tight"
                  >
                    Favorite anime
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {
                      statistics.favoriteAnimeCount
                    }{" "}
                    favorite{" "}
                    {
                      statistics.favoriteAnimeCount ===
                      1
                        ? "title"
                        : "titles"
                    }
                  </p>
                </div>

                <Link
                  href={`/user/${profile.username}/favorites`}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  View all →
                </Link>
              </div>

              {favoritePreview.length >
              0 ? (
                <div className="mt-5">
                  <AnimeFavoritesGrid
                    favorites={
                      favoritePreview
                    }
                  />
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-dashed px-6 py-10 text-center">
                  <p className="font-medium">
                    No favorite anime yet.
                  </p>

                  <p className="mt-2 text-sm text-muted-foreground">
                    Favorite titles will
                    appear here.
                  </p>
                </div>
              )}
            </section>

            <section
              aria-labelledby="profile-genres"
              className="mt-12"
            >
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Taste
                  </p>

                  <h2
                    id="profile-genres"
                    className="mt-1 text-2xl font-semibold tracking-tight"
                  >
                    Top genres
                  </h2>
                </div>

                <Link
                  href={`/user/${profile.username}/statistics`}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Explore stats →
                </Link>
              </div>

              {genrePreview.length >
              0 ? (
                <div className="mt-5 flex flex-wrap gap-3">
                  {genrePreview.map(
                    (
                      genre,
                      index,
                    ) => (
                      <div
                        key={
                          genre.id
                        }
                        className="flex items-center gap-3 rounded-full border bg-card px-4 py-2"
                      >
                        <span className="text-xs text-muted-foreground">
                          #{index + 1}
                        </span>

                        <span className="text-sm font-medium">
                          {genre.name}
                        </span>

                        <span className="text-xs text-muted-foreground">
                          {genre.count}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-dashed px-6 py-10 text-center">
                  <p className="font-medium">
                    No genre profile yet.
                  </p>

                  <p className="mt-2 text-sm text-muted-foreground">
                    Genre preferences will
                    emerge as the anime list
                    grows.
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
