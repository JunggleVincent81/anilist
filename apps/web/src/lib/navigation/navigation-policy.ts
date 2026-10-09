/** AN-130: single place for existing anime destinations and route highlighting. */
export const ANIME_MENU_LINKS = [
  { label: "Browse Anime", href: "/discover" },
  { label: "Seasonal Anime", href: "/season" },
  { label: "Airing Schedule", href: "/schedule" },
] as const

/** AN-136: catalogue routes are implemented; empty states are intentional. */
export const CATALOG_MENU_LINKS = [
  { label: "Manga", href: "/manga" },
  { label: "Music", href: "/music" },
] as const

type NavSection = "home" | "anime" | "manga" | "music" | "feed"

export function isPrimaryNavActive(pathname: string, section: NavSection): boolean {
  if (section === "home") return pathname === "/"
  if (section === "manga" || section === "music") {
    const prefix = `/${section}`
    return pathname === prefix || pathname.startsWith(`${prefix}/`)
  }
  if (section === "feed") return pathname === "/feed" || pathname.startsWith("/feed/")
  return ["/discover", "/season", "/schedule", "/anime"].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}
