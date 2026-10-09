import Link from "next/link"
import { ArrowUpRight, CalendarClock, Clapperboard } from "lucide-react"

import { formatAnimeSeason, getCurrentAnimeSeason } from "@/lib/anime/season"
import { discoverAnime, getAnimeBySlug } from "@/lib/graphql/anime"
import type { AnimeDetail, AnimeSummary } from "@/lib/graphql/anime"
import { getAiringSchedule } from "@/lib/graphql/airing"
import type { AiringScheduleItem } from "@/lib/graphql/airing"
import { safeSpotlightImage } from "@/lib/home/spotlight-policy"
import {
  airingCandidateWindow, eligiblePublicPreview, seasonalCandidateWindow,
} from "@/lib/home/seasonal-airing-policy"
import { TodayAiringList } from "@/components/home/today-airing-list"

type Preview<T> = { state: "ready"; items: T[] } | { state: "unavailable" | "empty"; items: [] }

async function safeDetails(items: AnimeSummary[]): Promise<{ safe: AnimeDetail[]; failures: boolean }> {
  const results = await Promise.allSettled(items.map((item) => getAnimeBySlug(item.slug)))
  const safe: AnimeDetail[] = []
  let failures = false
  for (let i = 0; i < results.length; i += 1) {
    const result = results[i]
    if (result.status === "rejected") { failures = true; continue }
    if (eligiblePublicPreview(items[i], result.value)) safe.push(result.value)
  }
  return { safe, failures }
}

async function currentSeasonPreview(): Promise<Preview<AnimeDetail>> {
  const period = getCurrentAnimeSeason()
  try {
    const result = await discoverAnime({
      seasons: [period.season], seasonYear: period.year,
      page: 1, perPage: 24, sort: "TITLE_ASC",
    })
    const candidates = seasonalCandidateWindow(result.items, period.season, period.year)
    if (candidates.length === 0) return { state: "empty", items: [] }
    const verified = await safeDetails(candidates)
    const items = verified.safe.filter((item) =>
      item.season === period.season && item.seasonYear === period.year,
    ).slice(0, 4)
    if (items.length > 0) return { state: "ready", items }
    return { state: verified.failures ? "unavailable" : "empty", items: [] }
  } catch {
    return { state: "unavailable", items: [] }
  }
}

async function todayAiringPreview(): Promise<Preview<AiringScheduleItem>> {
  try {
    // Provider query is strictly future/upcoming; never imply that an episode
    // has already released. Three days covers today's local timezone edges.
    const result = await getAiringSchedule(3)
    const candidates = airingCandidateWindow(result.items, Date.now())
    if (candidates.length === 0) return { state: "empty", items: [] }
    const results = await Promise.allSettled(candidates.map((item) => getAnimeBySlug(item.anime.slug)))
    const allowed: AiringScheduleItem[] = []
    let failed = false
    results.forEach((result, index) => {
      if (result.status === "rejected") { failed = true; return }
      if (eligiblePublicPreview(candidates[index].anime, result.value)) allowed.push(candidates[index])
    })
    if (allowed.length > 0) return { state: "ready", items: allowed }
    return { state: failed ? "unavailable" : "empty", items: [] }
  } catch {
    return { state: "unavailable", items: [] }
  }
}

export async function HomeSeasonAndAiring() {
  const period = getCurrentAnimeSeason()
  const [seasonal, airing] = await Promise.all([currentSeasonPreview(), todayAiringPreview()])
  const seasonName = formatAnimeSeason(period)
  const seasonLink = `/season?season=${period.season}&year=${period.year}`
  return (
    <section aria-label="Seasonal anime and today's airing schedule" className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
      <div aria-labelledby="home-current-season-title" className="min-w-0 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Anime database</p>
            <h2 id="home-current-season-title" className="mt-1 flex items-center gap-2 text-xl font-semibold tracking-tight">
              <Clapperboard aria-hidden="true" className="size-5 text-primary" /> {seasonName} Anime
            </h2>
          </div>
          <Link href={seasonLink} className="shrink-0 text-xs font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            View all <ArrowUpRight aria-hidden="true" className="inline size-3.5" />
          </Link>
        </div>
        {seasonal.state === "ready" ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label={`Anime from ${seasonName}`}>
            {seasonal.items.map((anime) => {
              const poster = safeSpotlightImage(anime.coverImageUrl)
              return (
                <li key={anime.id} className="min-w-0">
                  <Link href={`/anime/${encodeURIComponent(anime.slug)}`} className="group block rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                    <div
                      role={poster ? "img" : undefined}
                      aria-label={poster ? `${anime.title} cover` : undefined}
                      className="flex aspect-[2/3] items-center justify-center overflow-hidden rounded-lg border border-border bg-muted bg-cover bg-center p-2 text-center text-xs text-muted-foreground transition-colors group-hover:border-primary/40"
                      style={poster ? { backgroundImage: `url(${JSON.stringify(poster)})` } : undefined}
                    >{!poster ? "No cover" : null}</div>
                    <p className="mt-2 line-clamp-2 text-sm font-medium group-hover:text-primary">{anime.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{anime.format} · {anime.status}</p>
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : (
          <p role="status" className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            {seasonal.state === "unavailable"
              ? "Seasonal titles are temporarily unavailable. You can still open the full season page."
              : "No eligible public anime are available for this season in the current preview."}
          </p>
        )}
      </div>
      <div aria-labelledby="home-airing-today-title" className="min-w-0 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id="home-airing-today-title" className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <CalendarClock aria-hidden="true" className="size-5 text-primary" /> Airing Today
          </h2>
          <Link href="/schedule" className="shrink-0 text-xs font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            Schedule <ArrowUpRight aria-hidden="true" className="inline size-3.5" />
          </Link>
        </div>
        {airing.state === "ready" ? (
          <TodayAiringList items={airing.items} />
        ) : (
          <p role="status" className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            {airing.state === "unavailable"
              ? "Airing times are temporarily unavailable. Check the full schedule later."
              : "No verified upcoming episodes are available in the current schedule preview."}
          </p>
        )}
        <p className="mt-3 text-xs leading-5 text-muted-foreground">Future episode times can change. This is a schedule, not an episode streaming or release feed.</p>
      </div>
    </section>
  )
}
