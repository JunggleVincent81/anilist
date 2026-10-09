import Link from "next/link"
import { fetchHomeCommunityRanking } from "@/lib/graphql/home-ranking"

export async function HomeCommunityRanking() {
  let ranked: Awaited<ReturnType<typeof fetchHomeCommunityRanking>> = []
  let unavailable = false
  try { ranked = await fetchHomeCommunityRanking() } catch { unavailable = true }
  return (
    <section aria-labelledby="home-ranking-title" className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Our community ratings</p>
        <h2 id="home-ranking-title" className="mt-1 text-2xl font-bold">Community-rated anime</h2>
        <p className="mt-2 text-sm text-muted-foreground">Ranked by a weighted score from this community’s own reviews. Scores with fewer ratings receive stronger smoothing toward our community average (prior weight 10). Minimum 3 scored reviews; only verified non-adult catalogue entries. Not an official or external ranking.</p>
      </div>
      {unavailable ? <p role="status" className="rounded-xl border border-border p-4 text-sm">Community ratings are temporarily unavailable.</p> : ranked.length ? (
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ranked.map((anime, index) => (
            <li key={anime.slug} className="rounded-xl border border-border bg-surface p-4">
              <span className="text-xs text-muted-foreground">#{index + 1} · {anime.scoredReviewCount} scored reviews</span>
              <Link href={`/anime/${encodeURIComponent(anime.slug)}`} className="mt-2 block font-semibold hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">{anime.title}</Link>
              <p className="mt-2 text-sm font-medium">{anime.weightedScore.toFixed(2)} / 10 weighted community score</p>
              <p className="mt-1 text-xs text-muted-foreground">Raw community average: {anime.averageScore.toFixed(2)} / 10</p>
            </li>
          ))}
        </ol>
      ) : <p role="status" className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">No anime currently meet the minimum review count and verified non-adult eligibility requirement.</p>}
    </section>
  )
}
