export type PulsePreview = {
  id: string
  text: string | null
  type: string
  anime: { slug: string; title: string } | null
  actor: { username: string; displayName: string | null }
  createdAt: string
}
export type PublicReviewPreview = {
  id: string
  title: string | null
  body: string
  isSpoiler: boolean
  score: number | null
  createdAt: string
  author: { username: string; displayName: string | null }
  anime: { slug: string; title: string }
}
export function previewExcerpt(value: string, maxLength = 160): string {
  const compact = value.replace(/\s+/g, " ").trim()
  return compact.length <= maxLength ? compact : `${compact.slice(0, maxLength - 1).trimEnd()}…`
}
export function publicPulsePreview(items: PulsePreview[]): PulsePreview[] {
  // Never render unverified anime-linked activity in this overview.
  return items.filter((item) =>
    item.type === "TEXT" && item.anime === null &&
    typeof item.text === "string" && item.text.trim().length > 0 &&
    /^[a-z0-9_]{3,24}$/.test(item.actor.username),
  ).slice(0, 3)
}
export function publicReviewPreview(items: PublicReviewPreview[]): PublicReviewPreview[] {
  // Defense in depth: backend excludes spoilers and unknown/adult catalog items.
  return items.filter((item) =>
    !item.isSpoiler && item.anime?.slug &&
    /^[a-z0-9_]{3,24}$/.test(item.author.username),
  ).slice(0, 3)
}
