import Link from "next/link"
import { ArrowUpRight, MessageCircle, Star, Users } from "lucide-react"
import { fetchHomePulse, fetchHomeRecentReviews } from "@/lib/graphql/home-community"
import { previewExcerpt, publicPulsePreview, publicReviewPreview } from "@/lib/home/community-preview-policy"

function dateLabel(value: string): string {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? "Recently" : parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
}

export async function HomeCommunityPulseAndReviews() {
  const [pulseResult, reviewsResult] = await Promise.allSettled([
    fetchHomePulse(),
    fetchHomeRecentReviews(),
  ])
  const pulse = pulseResult.status === "fulfilled" ? publicPulsePreview(pulseResult.value) : []
  const reviews = reviewsResult.status === "fulfilled" ? publicReviewPreview(reviewsResult.value) : []
  return (
    <section aria-labelledby="home-community-title" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Anime community</p>
          <h2 id="home-community-title" className="mt-1 text-2xl font-bold tracking-tight">From the community</h2>
          <p className="mt-2 text-sm text-muted-foreground">Recent public updates and reviews from other fans.</p>
        </div>
        <Link href="/feed" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          Open feed <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <div className="min-w-0 rounded-2xl border border-border bg-surface p-5 sm:p-6" aria-labelledby="community-pulse-title">
          <h3 id="community-pulse-title" className="flex items-center gap-2 text-lg font-semibold"><Users aria-hidden="true" className="size-5 text-primary" /> Community Pulse</h3>
          {pulse.length ? (
            <ul className="mt-4 space-y-3">
              {pulse.map((item) => (
                <li key={item.id} className="rounded-xl border border-border bg-background/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <Link href={`/user/${encodeURIComponent(item.actor.username)}`} className="font-semibold text-foreground hover:text-primary hover:underline">{item.actor.displayName || item.actor.username}</Link>
                    <span>{dateLabel(item.createdAt)}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{previewExcerpt(item.text ?? "")}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p role="status" className="mt-4 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              {pulseResult.status === "rejected" ? "Community updates are temporarily unavailable." : "No public text updates yet. Join the conversation in Feed."}
            </p>
          )}
          <p className="mt-4 text-xs text-muted-foreground">Public posts may contain unmarked discussion spoilers. Reply and post in Feed.</p>
        </div>
        <div className="min-w-0 rounded-2xl border border-border bg-surface p-5 sm:p-6" aria-labelledby="community-reviews-title">
          <h3 id="community-reviews-title" className="flex items-center gap-2 text-lg font-semibold"><MessageCircle aria-hidden="true" className="size-5 text-primary" /> Community Reviews</h3>
          {reviews.length ? (
            <ul className="mt-4 space-y-3">
              {reviews.map((review) => (
                <li key={review.id} className="rounded-xl border border-border bg-background/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <Link href={`/user/${encodeURIComponent(review.author.username)}`} className="font-semibold text-foreground hover:text-primary hover:underline">{review.author.displayName || review.author.username}</Link>
                    {review.score !== null && review.score >= 1 && review.score <= 10 ? (
                      <span className="inline-flex items-center gap-1"><Star aria-hidden="true" className="size-3.5 text-primary" />{review.score.toFixed(1)}/10</span>
                    ) : <span>{dateLabel(review.createdAt)}</span>}
                  </div>
                  <Link href={`/anime/${encodeURIComponent(review.anime.slug)}`} className="mt-2 block text-sm font-semibold hover:text-primary hover:underline">{review.anime.title}</Link>
                  {review.title ? <p className="mt-1 text-sm font-medium">{previewExcerpt(review.title, 110)}</p> : null}
                  <p className="mt-2 break-words text-sm leading-6 text-muted-foreground">{previewExcerpt(review.body, 175)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p role="status" className="mt-4 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              {reviewsResult.status === "rejected" ? "Reviews are temporarily unavailable." : "No eligible non-spoiler community reviews yet. Reviews appear after age eligibility is verified."}
            </p>
          )}
          <p className="mt-4 text-xs text-muted-foreground">Spoiler-tagged reviews are excluded from this preview. Unmarked spoilers are still possible.</p>
        </div>
      </div>
    </section>
  )
}
