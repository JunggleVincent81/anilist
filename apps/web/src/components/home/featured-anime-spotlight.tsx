import Link from "next/link"
import { ArrowUpRight, CalendarDays, ListPlus, Sparkles } from "lucide-react"

import { formatAnimeSeason, getCurrentAnimeSeason } from "@/lib/anime/season"
import { discoverAnime, getAnimeBySlug } from "@/lib/graphql/anime"
import type { AnimeDetail } from "@/lib/graphql/anime"
import {
  eligibleSpotlightDetail,
  safeSpotlightImage,
  spotlightCandidates,
  spotlightExcerpt,
} from "@/lib/home/spotlight-policy"

type SpotlightResult =
  | { state: "ready"; anime: AnimeDetail }
  | { state: "empty" | "unavailable" }

async function fetchSpotlight(): Promise<SpotlightResult> {
  const period = getCurrentAnimeSeason()
  let discovered
  try {
    discovered = await discoverAnime({
      seasons: [period.season],
      seasonYear: period.year,
      page: 1,
      perPage: 24,
      sort: "TITLE_ASC",
    })
  } catch {
    return { state: "unavailable" }
  }

  let detailFailed = false
  for (const candidate of spotlightCandidates(discovered.items)) {
    try {
      const detail = await getAnimeBySlug(candidate.slug)
      if (eligibleSpotlightDetail(detail, period.season, period.year)) {
        return { state: "ready", anime: detail }
      }
    } catch {
      detailFailed = true
    }
  }
  return { state: detailFailed ? "unavailable" : "empty" }
}

const primaryLink =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
const secondaryLink =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"

export async function FeaturedAnimeSpotlight() {
  const period = getCurrentAnimeSeason()
  const seasonLabel = formatAnimeSeason(period)
  const featured = await fetchSpotlight()
  const anime = featured.state === "ready" ? featured.anime : null
  const poster = anime ? safeSpotlightImage(anime.coverImageUrl) : null
  const summary = anime ? spotlightExcerpt(anime.description) : null
  const animeHref = anime ? `/anime/${encodeURIComponent(anime.slug)}` : null
  const metadata = anime
    ? [anime.format, anime.status, anime.episodes === null ? null : `${anime.episodes} episodes`]
        .filter((value): value is string => Boolean(value))
    : []

  return (
    <section
      aria-labelledby="home-intro-title"
      className="overflow-hidden rounded-2xl border border-border bg-surface px-5 py-7 sm:px-8 sm:py-9"
    >
      <div className="grid items-center gap-6 sm:grid-cols-[minmax(0,1fr)_9rem] sm:gap-8 lg:grid-cols-[minmax(0,1fr)_10rem]">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <Sparkles aria-hidden="true" className="size-4" />
            Anime discovery &amp; community · {seasonLabel}
          </p>
          <h1 id="home-intro-title" className="mt-3 max-w-3xl text-balance text-2xl font-bold tracking-tight sm:text-3xl">
            {anime ? anime.title : "Discover this season's anime"}
          </h1>
          {anime ? (
            <>
              <p className="mt-2 text-xs text-muted-foreground">
                Season spotlight · Selected from the public catalog, not a popularity ranking
              </p>
              <p className="mt-3 text-sm text-muted-foreground">{metadata.join(" · ")}</p>
              {anime.genres.length > 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {anime.genres.slice(0, 3).map((genre) => genre.name).join(" · ")}
                </p>
              ) : null}
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                {summary ?? "Explore this title's information, tracking options, and community reviews."}
              </p>
            </>
          ) : (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground" role="status">
              {featured.state === "unavailable"
                ? "The seasonal spotlight is temporarily unavailable. Browse the anime catalog or check the season page instead."
                : "No eligible spotlight title is available for this season yet. Explore the catalog to find anime."}
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            {animeHref ? (
              <>
                <Link href={animeHref} className={primaryLink}>
                  View details <ArrowUpRight aria-hidden="true" className="size-4" />
                </Link>
                <Link href={animeHref} className={secondaryLink} aria-label={`Open ${anime?.title} to manage your anime list`}>
                  <ListPlus aria-hidden="true" className="size-4" /> Manage list
                </Link>
              </>
            ) : (
              <Link href="/season" className={primaryLink}>
                Browse {seasonLabel} <CalendarDays aria-hidden="true" className="size-4" />
              </Link>
            )}
            <Link href="/discover" className={secondaryLink}>
              Browse database <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </div>
        <div className="mx-auto hidden w-36 sm:block lg:w-40" aria-hidden={poster ? undefined : true}>
          <div
            className="flex aspect-[2/3] items-center justify-center overflow-hidden rounded-xl border border-border bg-muted bg-cover bg-center text-center text-xs text-muted-foreground shadow-sm"
            role={poster ? "img" : undefined}
            aria-label={poster && anime ? `${anime.title} cover` : undefined}
            style={poster ? { backgroundImage: `url(${JSON.stringify(poster)})` } : undefined}
          >
            {!poster ? <span className="px-4">Anime database</span> : null}
          </div>
        </div>
      </div>
      <div className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
        Explore anime details, manage your list, and join community conversations — no streaming content.
      </div>
    </section>
  )
}
