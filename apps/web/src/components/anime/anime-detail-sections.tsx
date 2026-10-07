import type {
  AnimeDetail,
  AnimeStudioCredit,
} from "@/lib/graphql/anime"

// import {
//   formatAnimeEnumLabel,
// } from "@/lib/anime/display"

type AnimeDetailSectionsProps = {
  anime: AnimeDetail
}

type StudioGroupProps = {
  title: string
  credits: AnimeStudioCredit[]
}

const MAX_VISIBLE_TAGS = 12

function StudioGroup({
  title,
  credits,
}: StudioGroupProps) {
  if (credits.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">
        {title}
      </h3>

      <div className="flex flex-wrap gap-2">
        {credits.map(
          (credit) => (
            <span
              key={`${credit.role}-${credit.studio.id}`}
              className="rounded-full border bg-muted/40 px-3 py-1 text-xs"
            >
              {credit.studio.name}

              {credit.isMain ? (
                <span className="ml-1 text-muted-foreground">
                  · Main
                </span>
              ) : null}
            </span>
          ),
        )}
      </div>
    </div>
  )
}

export function AnimeDetailSections({
  anime,
}: AnimeDetailSectionsProps) {
  const animationStudios =
    anime.studios.filter(
      (credit) =>
        credit.role ===
        "ANIMATION",
    )

  const producers =
    anime.studios.filter(
      (credit) =>
        credit.role ===
        "PRODUCER",
    )

  const visibleTags =
    anime.tags.slice(
      0,
      MAX_VISIBLE_TAGS,
    )

  const hiddenTagCount =
    Math.max(
      anime.tags.length -
        visibleTags.length,
      0,
    )

  return (
    <div className="space-y-12">
      <section
        aria-labelledby="anime-synopsis"
        className="space-y-4"
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Story
          </p>

          <h2
            id="anime-synopsis"
            className="mt-1 text-2xl font-semibold tracking-tight"
          >
            Synopsis
          </h2>
        </div>

        {anime.description ? (
          <p className="max-w-3xl whitespace-pre-line text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
            {anime.description}
          </p>
        ) : (
          <div className="rounded-xl border border-dashed p-5">
            <p className="text-sm text-muted-foreground">
              No synopsis is available for this anime yet.
            </p>
          </div>
        )}
      </section>

      {(anime.genres.length > 0 ||
        anime.tags.length > 0) ? (
        <section
          aria-labelledby="anime-taxonomy"
          className="space-y-5"
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Classification
            </p>

            <h2
              id="anime-taxonomy"
              className="mt-1 text-2xl font-semibold tracking-tight"
            >
              Genres & Tags
            </h2>
          </div>

          {anime.genres.length >
          0 ? (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">
                Genres
              </h3>

              <div className="flex flex-wrap gap-2">
                {anime.genres.map(
                  (genre) => (
                    <span
                      key={genre.id}
                      className="rounded-full border bg-primary/5 px-3 py-1 text-xs font-medium"
                    >
                      {genre.name}
                    </span>
                  ),
                )}
              </div>
            </div>
          ) : null}

          {anime.tags.length >
          0 ? (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">
                Tags
              </h3>

              <div className="flex flex-wrap gap-2">
                {visibleTags.map(
                  (tag) => (
                    <span
                      key={tag.id}
                      className="rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground"
                    >
                      {tag.name}
                    </span>
                  ),
                )}

                {hiddenTagCount >
                0 ? (
                  <span className="rounded-full border border-dashed px-3 py-1 text-xs text-muted-foreground">
                    +{hiddenTagCount} more
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {anime.studios.length >
      0 ? (
        <section
          aria-labelledby="anime-studios"
          className="space-y-5"
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Production
            </p>

            <h2
              id="anime-studios"
              className="mt-1 text-2xl font-semibold tracking-tight"
            >
              Studios
            </h2>
          </div>

          <div className="space-y-5">
            <StudioGroup
              title="Animation"
              credits={
                animationStudios
              }
            />

            <StudioGroup
              title="Producers"
              credits={
                producers
              }
            />
          </div>
        </section>
      ) : null}

      {anime.isAdult ===
      true ? (
        <section
          aria-labelledby="anime-content-note"
          className="rounded-xl border border-dashed p-5"
        >
          <h2
            id="anime-content-note"
            className="font-medium"
          >
            Content note
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            This title is marked as adult content in the catalog.
          </p>
        </section>
      ) : null}
    </div>
  )
}

// export function getAnimeStudioRoleLabel(
//   role:
//     AnimeStudioCredit["role"],
// ): string {
//   return formatAnimeEnumLabel(
//     role,
//   )
// }