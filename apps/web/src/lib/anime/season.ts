import type {
  AnimeSeason,
} from "@/lib/graphql/anime"

const SEASONS: AnimeSeason[] = [
  "WINTER",
  "SPRING",
  "SUMMER",
  "FALL",
]

type AnimeSeasonPeriod = {
  season: AnimeSeason
  year: number
}

function getSeasonFromMonth(
  month: number,
): AnimeSeason {
  if (month <= 2) {
    return "WINTER"
  }

  if (month <= 5) {
    return "SPRING"
  }

  if (month <= 8) {
    return "SUMMER"
  }

  return "FALL"
}

function getCurrentAnimeSeason(
  date = new Date(),
): AnimeSeasonPeriod {
  return {
    season:
      getSeasonFromMonth(
        date.getMonth(),
      ),
    year:
      date.getFullYear(),
  }
}

function getAdjacentAnimeSeason(
  period: AnimeSeasonPeriod,
  offset: -1 | 1,
): AnimeSeasonPeriod {
  const index =
    SEASONS.indexOf(
      period.season,
    )

  const nextIndex =
    index + offset

  if (nextIndex < 0) {
    return {
      season: "FALL",
      year:
        period.year - 1,
    }
  }

  if (
    nextIndex >=
    SEASONS.length
  ) {
    return {
      season: "WINTER",
      year:
        period.year + 1,
    }
  }

  return {
    season:
      SEASONS[nextIndex],
    year:
      period.year,
  }
}

function isAnimeSeason(
  value: string | undefined,
): value is AnimeSeason {
  return (
    value !== undefined &&
    SEASONS.includes(
      value as AnimeSeason,
    )
  )
}

function formatAnimeSeason(
  period: AnimeSeasonPeriod,
): string {
  const label =
    period.season
      .charAt(0) +
    period.season
      .slice(1)
      .toLowerCase()

  return `${label} ${period.year}`
}

export {
  SEASONS,
  formatAnimeSeason,
  getAdjacentAnimeSeason,
  getCurrentAnimeSeason,
  isAnimeSeason,
}

export type {
  AnimeSeasonPeriod,
}