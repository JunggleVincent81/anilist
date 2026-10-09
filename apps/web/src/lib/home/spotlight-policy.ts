import type { AnimeDetail, AnimeSeason, AnimeSummary } from "@/lib/graphql/anime"

// This is not a popularity ranking. Favor currently airing catalog items,
// valid cover URLs, and a stable alphabetical order for reproducibility.
export function safeSpotlightImage(value: string | null): string | null {
  if (!value) return null
  try {
    const parsed = new URL(value)
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? parsed.toString()
      : null
  } catch {
    return null
  }
}

export function spotlightCandidates(items: AnimeSummary[]): AnimeSummary[] {
  return [...items]
    .filter((item) => Boolean(item.slug?.trim() && item.title?.trim()))
    .sort((left, right) => {
      const airing = Number(right.status === "AIRING") - Number(left.status === "AIRING")
      if (airing !== 0) return airing
      const cover = Number(Boolean(safeSpotlightImage(right.coverImageUrl))) -
        Number(Boolean(safeSpotlightImage(left.coverImageUrl)))
      if (cover !== 0) return cover
      return left.title.localeCompare(right.title) || left.slug.localeCompare(right.slug)
    })
    .slice(0, 8)
}

// AnimeSummary does not include the adult flag, so never promote a title
// without checking the detail endpoint and an explicit isAdult === false.
export function eligibleSpotlightDetail(
  detail: AnimeDetail | null,
  season: AnimeSeason,
  year: number,
): detail is AnimeDetail {
  return Boolean(
    detail &&
    detail.isAdult === false &&
    detail.season === season &&
    detail.seasonYear === year &&
    detail.slug?.trim() &&
    detail.title?.trim(),
  )
}

export function spotlightExcerpt(value: string | null): string | null {
  if (!value) return null
  const cleaned = value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
  if (!cleaned) return null
  return cleaned.length > 185 ? `${cleaned.slice(0, 182).trimEnd()}…` : cleaned
}
