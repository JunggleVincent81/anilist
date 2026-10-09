/** AN-130: single place for existing anime destinations and route highlighting. */
export const ANIME_MENU_LINKS = [
  { label: "Browse Anime", href: "/discover" },
  { label: "Seasonal Anime", href: "/season" },
  { label: "Airing Schedule", href: "/schedule" },
] as const

/** Future sections are labels only: no bogus href or placeholder pages. */
export const FUTURE_CATEGORIES = ["Manga", "Music"] as const

type NavSection = "home" | "anime" | "feed"

export function isPrimaryNavActive(pathname: string, section: NavSection): boolean {
  if (section === "home") return pathname === "/"
  if (section === "feed") return pathname === "/feed" || pathname.startsWith("/feed/")
  return ["/discover", "/season", "/schedule", "/anime"].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}
