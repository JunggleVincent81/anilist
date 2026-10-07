import {
  AnimeCard,
} from "@/components/anime/anime-card"

import type {
  AnimeFavorite,
} from "@/lib/graphql/favorites"

type AnimeFavoritesGridProps = {
  favorites:
    AnimeFavorite[]
}

export function AnimeFavoritesGrid({
  favorites,
}: AnimeFavoritesGridProps) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {favorites.map(
        (favorite) => (
          <AnimeCard
            key={
              favorite.id
            }
            anime={
              favorite.anime
            }
          />
        ),
      )}
    </div>
  )
}
