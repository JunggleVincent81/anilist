import type { AnimeDetail, AnimeSeason, AnimeSummary } from "@/lib/graphql/anime"
import type { AiringScheduleItem } from "@/lib/graphql/airing"

// AnimeSummary is NOT sufficient for a public home preview: it does not
// expose isAdult. All visible entries must be resolved and checked with
// animeBySlug before rendering. The input windows limit database requests.
export function seasonalCandidateWindow(
  items: AnimeSummary[],
  season: AnimeSeason,
  year: number,
): AnimeSummary[] {
  return items
    .filter((item) => Boolean(
      item.slug?.trim() && item.title?.trim() &&
      item.season === season && item.seasonYear === year,
    ))
    .slice(0, 8)
}

export function eligiblePublicPreview(
  summary: AnimeSummary,
  detail: AnimeDetail | null,
): detail is AnimeDetail {
  return Boolean(
    detail && detail.isAdult === false &&
    detail.id === summary.id && detail.slug === summary.slug &&
    detail.title?.trim(),
  )
}

export function airingCandidateWindow(
  items: AiringScheduleItem[],
  nowMs: number,
): AiringScheduleItem[] {
  return items
    .filter((item) => Boolean(
      item.anime?.id && item.anime.slug?.trim() && item.anime.title?.trim() &&
      Number.isInteger(item.episode) && item.episode > 0 &&
      Number.isFinite(Date.parse(item.airingAt)) &&
      Date.parse(item.airingAt) >= nowMs,
    ))
    .sort((a, b) =>
      Date.parse(a.airingAt) - Date.parse(b.airingAt) ||
      a.anime.slug.localeCompare(b.anime.slug) || a.episode - b.episode,
    )
    .slice(0, 8)
}

export function localDayKey(value: string | Date, useLocal: boolean): string {
  const date = new Date(value)
  if (useLocal) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }
  return date.toISOString().slice(0, 10)
}

export function todayAiringItems(
  items: AiringScheduleItem[],
  now: Date,
  useLocal: boolean,
): AiringScheduleItem[] {
  const key = localDayKey(now, useLocal)
  return items.filter((item) =>
    Number.isFinite(Date.parse(item.airingAt)) &&
    localDayKey(item.airingAt, useLocal) === key,
  ).slice(0, 4)
}
