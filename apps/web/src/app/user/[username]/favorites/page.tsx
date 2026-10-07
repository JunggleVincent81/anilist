import Link from "next/link"
import {
  notFound,
} from "next/navigation"
import {
  HeartIcon,
} from "lucide-react"

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
  Button,
} from "@/components/ui/button"
import {
  getAnimeFavorites,
} from "@/lib/graphql/favorites"

type UserFavoritesPageProps = {
  params: Promise<{
    username: string
  }>
}

export default async function UserFavoritesPage({
  params,
}: UserFavoritesPageProps) {
  const {
    username,
  } = await params

  const favorites =
    await getAnimeFavorites(
      username,
    )

  if (!favorites) {
    notFound()
  }

  const count =
    favorites.items.length

  return (
    <main>
      <PageContainer>
        <ContentSection spacing="lg">
          <div className="mx-auto w-full max-w-6xl">
            <div className="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Favorites
                </p>

                <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
                  @{favorites.username}
                  &apos;s favorites
                </h1>

                <p className="mt-2 text-sm text-muted-foreground">
                  {count}{" "}
                  {count === 1
                    ? "favorite anime"
                    : "favorite anime"}
                </p>
              </div>

              <Button
                variant="outline"
                render={
                  <Link
                    href={`/user/${favorites.username}`}
                  />
                }
              >
                View Profile
              </Button>
            </div>

            {count > 0 ? (
              <div className="mt-8">
                <AnimeFavoritesGrid
                  favorites={
                    favorites.items
                  }
                />
              </div>
            ) : (
              <div className="mt-8 rounded-2xl border border-dashed px-6 py-16 text-center">
                <HeartIcon
                  aria-hidden="true"
                  className="mx-auto size-6 text-muted-foreground"
                />

                <p className="mt-4 font-medium">
                  No favorites yet.
                </p>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                  This user has not
                  favorited any anime
                  yet.
                </p>
              </div>
            )}
          </div>
        </ContentSection>
      </PageContainer>
    </main>
  )
}
