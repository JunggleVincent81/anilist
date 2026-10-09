import type {
  Metadata,
} from "next"

import {
  cache,
} from "react"

import {
  notFound,
} from "next/navigation"

import {
  AnimeDetailHero,
} from "@/components/anime/anime-detail-hero"
import {
  AnimeDetailMetadata,
} from "@/components/anime/anime-detail-metadata"
import {
  AnimeDetailSections,
} from "@/components/anime/anime-detail-sections"
import {
  AnimeRelations,
} from "@/components/anime/anime-relations"
import { AnimeReviews } from "@/components/anime/anime-reviews"

import {
  ContentSection,
} from "@/components/layout/content-section"
import {
  PageContainer,
} from "@/components/layout/page-container"

import {
  formatAnimeEnumLabel,
  formatAnimeSeason,
} from "@/lib/anime/display"

import {
  getAnimeBySlug,
} from "@/lib/graphql/anime"

type AnimePageProps = {
  params: Promise<{
    slug: string
  }>
}

const getAnimePageData =
  cache(
    async (
      slug: string,
    ) =>
      getAnimeBySlug(
        slug,
      ),
  )

function getMetadataImage(
  value: string | null,
): string | null {
  if (!value) {
    return null
  }

  try {
    const url =
      new URL(value)

    if (
      url.protocol !== "https:" &&
      url.protocol !== "http:"
    ) {
      return null
    }

    return url.toString()
  } catch {
    return null
  }
}

function createDescription(
  title: string,
  description: string | null,
  format: string,
  season: string | null,
): string {
  if (
    description?.trim()
  ) {
    return description
      .replace(
        /\s+/g,
        " ",
      )
      .trim()
      .slice(
        0,
        160,
      )
  }

  const metadata = [
    formatAnimeEnumLabel(
      format,
    ),
    season,
  ].filter(Boolean)

  return metadata.length > 0
    ? `${title} anime details — ${metadata.join(
        ", ",
      )}.`
    : `${title} anime details.`
}

export async function generateMetadata({
  params,
}: AnimePageProps): Promise<Metadata> {
  const {
    slug,
  } = await params

  const anime =
    await getAnimePageData(
      slug,
    )

  if (!anime) {
    return {
      title:
        "Anime not found",

      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const season =
    formatAnimeSeason(
      anime.season,
      anime.seasonYear,
    )

  const description =
    createDescription(
      anime.title,
      anime.description,
      anime.format,
      season,
    )

  const image =
    getMetadataImage(
      anime.bannerImageUrl,
    ) ??
    getMetadataImage(
      anime.coverImageUrl,
    )

  return {
    title:
      anime.title,

    description,

    openGraph: {
      title:
        anime.title,

      description,

      type:
        "website",

      ...(image
        ? {
            images: [
              image,
            ],
          }
        : {}),
    },

    twitter: {
      card:
        image
          ? "summary_large_image"
          : "summary",

      title:
        anime.title,

      description,

      ...(image
        ? {
            images: [
              image,
            ],
          }
        : {}),
    },
  }
}

export default async function AnimePage({
  params,
}: AnimePageProps) {
  const {
    slug,
  } = await params

  const anime =
    await getAnimePageData(
      slug,
    )

  if (!anime) {
    notFound()
  }

  const season =
    formatAnimeSeason(
      anime.season,
      anime.seasonYear,
    )

  return (
    <main>
      <PageContainer>
        <ContentSection spacing="lg">
          <AnimeDetailHero
            anime={anime}
          />

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
            <div className="min-w-0 space-y-12">
              <AnimeDetailSections
                anime={anime}
              />

              <AnimeDetailMetadata
                anime={anime}
              />

              <AnimeRelations
                relations={
                  anime.relations
                }
              />

              <AnimeReviews animeId={anime.id} animeTitle={anime.title} />
            </div>

            <aside
              aria-label="Anime information"
              className="lg:sticky lg:top-24"
            >
              <div className="rounded-xl border bg-card p-5">
                <h2 className="mb-5 text-xl font-semibold tracking-tight">
                  Information
                </h2>

                <dl className="space-y-4 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">
                      Format
                    </dt>

                    <dd className="text-right font-medium">
                      {formatAnimeEnumLabel(
                        anime.format,
                      )}
                    </dd>
                  </div>

                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">
                      Status
                    </dt>

                    <dd className="text-right font-medium">
                      {formatAnimeEnumLabel(
                        anime.status,
                      )}
                    </dd>
                  </div>

                  {anime.episodes !==
                  null ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">
                        Episodes
                      </dt>

                      <dd className="text-right font-medium">
                        {anime.episodes}
                      </dd>
                    </div>
                  ) : null}

                  {anime.durationMinutes !==
                  null ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">
                        Duration
                      </dt>

                      <dd className="text-right font-medium">
                        {
                          anime.durationMinutes
                        }{" "}
                        min
                      </dd>
                    </div>
                  ) : null}

                  {season ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">
                        Season
                      </dt>

                      <dd className="text-right font-medium">
                        {season}
                      </dd>
                    </div>
                  ) : null}

                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">
                      Source
                    </dt>

                    <dd className="text-right font-medium">
                      {formatAnimeEnumLabel(
                        anime.sourceMaterial,
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </aside>
          </div>
        </ContentSection>
      </PageContainer>
    </main>
  )
}