import type {
  AnimeSeason,
} from "@/lib/graphql/anime"

function formatAnimeEnumLabel(
  value: string,
): string {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ")
}

function formatAnimeSeason(
  season: AnimeSeason | null,
  seasonYear: number | null,
): string | null {
  if (!season && !seasonYear) {
    return null
  }

  if (season && seasonYear) {
    return `${formatAnimeEnumLabel(
      season,
    )} ${seasonYear}`
  }

  if (season) {
    return formatAnimeEnumLabel(
      season,
    )
  }

  return String(
    seasonYear,
  )
}

export {
  formatAnimeEnumLabel,
  formatAnimeSeason,
}