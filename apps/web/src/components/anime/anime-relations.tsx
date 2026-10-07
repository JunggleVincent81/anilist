import Link from "next/link"

import type {
  AnimeRelation,
  AnimeRelationDisplayType,
} from "@/lib/graphql/anime"

import {
  formatAnimeEnumLabel,
  formatAnimeSeason,
} from "@/lib/anime/display"

type AnimeRelationsProps = {
  relations: AnimeRelation[]
}

const RELATION_LABELS: Record<
  AnimeRelationDisplayType,
  string
> = {
  SEQUEL: "Sequel",
  PREQUEL: "Prequel",
  SIDE_STORY: "Side Story",
  SPIN_OFF: "Spin-off",
  PARENT: "Parent",
  ALTERNATIVE: "Alternative",
  SUMMARY: "Summary",
  COMPILATION: "Compilation",
  SOURCE: "Source",
  CONTAINS: "Contains",
  PART_OF: "Part of",
  OTHER: "Related",
}

const MAX_RELATIONS = 12

export function AnimeRelations({
  relations,
}: AnimeRelationsProps) {
  if (
    relations.length === 0
  ) {
    return null
  }

  const visibleRelations =
    relations.slice(
      0,
      MAX_RELATIONS,
    )

  const hiddenCount =
    Math.max(
      relations.length -
        visibleRelations.length,
      0,
    )

  return (
    <section
      aria-labelledby="anime-relations"
      className="space-y-5"
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Connections
        </p>

        <h2
          id="anime-relations"
          className="mt-1 text-2xl font-semibold tracking-tight"
        >
          Related Anime
        </h2>

        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Other anime connected to this title.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {visibleRelations.map(
          (
            relation,
          ) => (
            <RelationCard
              key={`${relation.type}-${relation.anime.id}`}
              relation={
                relation
              }
            />
          ),
        )}
      </div>

      {hiddenCount > 0 ? (
        <p className="text-sm text-muted-foreground">
          {hiddenCount} additional{" "}
          {hiddenCount === 1
            ? "relation"
            : "relations"}{" "}
          are not shown.
        </p>
      ) : null}
    </section>
  )
}

type RelationCardProps = {
  relation: AnimeRelation
}

function RelationCard({
  relation,
}: RelationCardProps) {
  const {
    anime,
  } = relation

  const season =
    formatAnimeSeason(
      anime.season,
      anime.seasonYear,
    )

  const metadata = [
    formatAnimeEnumLabel(
      anime.format,
    ),
    season,
  ].filter(
    (
      item,
    ): item is string =>
      Boolean(item),
  )

  return (
    <Link
      href={`/anime/${anime.slug}`}
      className="group grid min-w-0 grid-cols-[3.25rem_minmax(0,1fr)] gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-muted/40"
    >
      <div className="aspect-[2/3] overflow-hidden rounded-md border bg-muted">
        {anime.coverImageUrl ? (
          <div
            role="img"
            aria-label={`${anime.title} cover`}
            className="h-full w-full bg-cover bg-center"
            style={{
              backgroundImage:
                `url(${JSON.stringify(
                  anime.coverImageUrl,
                )})`,
            }}
          />
        ) : (
          <div
            aria-hidden="true"
            className="h-full w-full bg-gradient-to-br from-muted to-background"
          />
        )}
      </div>

      <div className="min-w-0 self-center">
        <p className="text-xs font-medium text-muted-foreground">
          {
            RELATION_LABELS[
              relation.type
            ]
          }
        </p>

        <h3 className="mt-1 line-clamp-2 text-sm font-medium leading-5 group-hover:underline">
          {anime.title}
        </h3>

        {metadata.length >
        0 ? (
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {metadata.join(
              " · ",
            )}
          </p>
        ) : null}
      </div>
    </Link>
  )
}