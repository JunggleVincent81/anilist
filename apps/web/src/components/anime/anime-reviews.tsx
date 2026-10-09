"use client"

import Link from "next/link"
import { useCallback, useEffect, useState, type FormEvent } from "react"
import { ChevronLeft, ChevronRight, Eye, EyeOff, LoaderCircle, Pencil, RefreshCw, Star, Trash2 } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import {
  createAnimeReview,
  deleteMyAnimeReview,
  fetchAnimeReviews,
  findOwnAnimeReview,
  updateAnimeReview,
  type AnimeReview,
  type AnimeReviewPage,
  type AnimeReviewStats,
} from "@/lib/graphql/reviews"
import {
  REVIEW_BODY_LIMIT,
  REVIEW_SCORE_CHOICES,
  REVIEW_TITLE_LIMIT,
  cleanReviewDraft,
  reviewScoreLabel,
  type ReviewDraft,
} from "@/lib/graphql/reviews.contract"

type Props = { animeId: string; animeTitle: string }
const BLANK_DRAFT: ReviewDraft = { title: "", body: "", score: null, isSpoiler: false }
function displayDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "Recently" : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}
function ReviewEntry({ item, mine, busy, onEdit, onDelete }: {
  item: AnimeReview
  mine: boolean
  busy: boolean
  onEdit: (review: AnimeReview) => void
  onDelete: (review: AnimeReview) => void
}) {
  const [spoilerVisible, setSpoilerVisible] = useState(false)
  const hidden = item.isSpoiler && !spoilerVisible
  return (
    <article className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/user/${encodeURIComponent(item.author.username)}`} className="text-sm font-semibold hover:text-primary hover:underline">
            {item.author.displayName || item.author.username}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">{displayDate(item.createdAt)}{item.updatedAt !== item.createdAt ? " · Edited" : ""}</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
          <Star aria-hidden="true" className="size-4" /> {reviewScoreLabel(item.score)}
        </div>
      </div>
      {hidden ? (
        <div className="mt-4 rounded-lg border border-dashed border-border bg-background/70 p-4">
          <p className="text-sm font-medium">This review contains spoilers.</p>
          <button type="button" aria-expanded={false} onClick={() => setSpoilerVisible(true)}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface">
            <Eye aria-hidden="true" className="size-4" /> Reveal review
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {item.isSpoiler ? <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Spoiler revealed</p> : null}
          {item.title ? <h3 className="text-base font-semibold break-words">{item.title}</h3> : null}
          <p className="whitespace-pre-wrap break-words text-sm leading-7">{item.body}</p>
          {item.isSpoiler ? (
            <button type="button" aria-expanded={true} onClick={() => setSpoilerVisible(false)}
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"><EyeOff aria-hidden="true" className="size-4" /> Hide spoilers</button>
          ) : null}
        </div>
      )}
      {mine ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
          <button type="button" disabled={busy} onClick={() => onEdit(item)} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-background disabled:opacity-50">
            <Pencil aria-hidden="true" className="size-4" /> Edit your review
          </button>
          <button type="button" disabled={busy} onClick={() => onDelete(item)} className="inline-flex items-center gap-2 rounded-lg border border-destructive/40 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50">
            <Trash2 aria-hidden="true" className="size-4" /> Delete
          </button>
        </div>
      ) : null}
    </article>
  )
}

function ReviewForm({ draft, setDraft, submitting, editing, cancel, submit }: {
  draft: ReviewDraft
  setDraft: (value: ReviewDraft) => void
  submitting: boolean
  editing: boolean
  cancel: () => void
  submit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-5" aria-label={editing ? "Edit anime review" : "Write anime review"}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="review-score" className="mb-1.5 block text-sm font-medium">Rating (optional)</label>
          <select id="review-score" value={draft.score === null ? "none" : String(draft.score)}
            onChange={(event) => setDraft({ ...draft, score: event.target.value === "none" ? null : Number(event.target.value) })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm">
            <option value="none">No rating</option>
            {REVIEW_SCORE_CHOICES.map((score) => <option value={score} key={score}>{score.toFixed(1)} / 10</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="review-title" className="mb-1.5 block text-sm font-medium">Title (optional)</label>
          <input id="review-title" value={draft.title} maxLength={REVIEW_TITLE_LIMIT} onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            placeholder="Give your review a title" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" />
        </div>
      </div>
      <div>
        <label htmlFor="review-body" className="mb-1.5 block text-sm font-medium">Your review</label>
        <textarea id="review-body" required maxLength={REVIEW_BODY_LIMIT} rows={6} value={draft.body}
          onChange={(event) => setDraft({ ...draft, body: event.target.value })}
          placeholder="What did you think about this anime?" className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm leading-6" />
        <p className="mt-1 text-right text-xs text-muted-foreground">{draft.body.length}/{REVIEW_BODY_LIMIT}</p>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" checked={draft.isSpoiler} onChange={(event) => setDraft({ ...draft, isSpoiler: event.target.checked })}
          className="size-4 accent-primary" /> Contains spoilers
      </label>
      <div className="flex flex-wrap gap-2">
        <button disabled={submitting || !draft.body.trim()} type="submit" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
          {submitting ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Star aria-hidden="true" className="size-4" />}
          {editing ? "Save changes" : "Publish review"}
        </button>
        {editing ? <button type="button" disabled={submitting} onClick={cancel} className="rounded-lg border border-border px-4 py-2.5 text-sm hover:bg-background">Cancel</button> : null}
      </div>
    </form>
  )
}

export function AnimeReviews({ animeId, animeTitle }: Props) {
  const { user, status } = useAuth()
  const authenticated = status === "authenticated" && user !== null
  const reviewerUsername = authenticated ? user?.username ?? null : null
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [reviews, setReviews] = useState<AnimeReviewPage | null>(null)
  const [stats, setStats] = useState<AnimeReviewStats | null>(null)
  const [mine, setMine] = useState<AnimeReview | null>(null)
  const [draft, setDraft] = useState<ReviewDraft>({ ...BLANK_DRAFT })
  const [editingId, setEditingId] = useState<string | null>(null)
  const refresh = useCallback(() => { setLoading(true); setReloadKey((value) => value + 1) }, [])
  useEffect(() => {
    let cancelled = false
    const getData = async () => {
      try {
        const [data, existing] = await Promise.all([
          fetchAnimeReviews(animeId, page),
          reviewerUsername ? findOwnAnimeReview(reviewerUsername, animeId) : Promise.resolve(null),
        ])
        if (cancelled) return
        setReviews(data.reviews)
        setStats(data.stats)
        setMine(existing)
        setError(null)
      } catch (cause) {
        if (cancelled) return
        setError(cause instanceof Error ? cause.message : "Could not load anime reviews.")
        setReviews(null)
        setStats(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void getData()
    return () => { cancelled = true }
  }, [animeId, page, reloadKey, reviewerUsername])
  function startEdit(review: AnimeReview) {
    if (!user || review.userId !== user.id || busy) return
    setEditingId(review.id)
    setDraft({ title: review.title ?? "", body: review.body, score: review.score, isSpoiler: review.isSpoiler })
    setError(null)
    setMessage(null)
    document.getElementById("review-editor")?.scrollIntoView({ behavior: "smooth", block: "center" })
  }
  function cancelEdit() { setEditingId(null); setDraft({ ...BLANK_DRAFT }) }
  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!authenticated || busy) return
    setError(null)
    setMessage(null)
    try {
      cleanReviewDraft(draft) // client-side validation; GraphQL service normalizes the original draft
      setBusy(true)
      if (editingId) await updateAnimeReview(editingId, draft)
      else await createAnimeReview(animeId, draft)
      cancelEdit()
      setPage(1)
      setMessage(editingId ? "Your review was updated." : "Your review was published.")
      refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save review.")
    } finally { setBusy(false) }
  }
  async function removeReview(review: AnimeReview) {
    if (!authenticated || !user || user.id !== review.userId || busy) return
    if (!window.confirm("Delete your review? This cannot be undone.")) return
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const removed = await deleteMyAnimeReview(review.id)
      if (!removed) throw new Error("Your review could not be found.")
      cancelEdit()
      setPage(1)
      setMessage("Your review was deleted.")
      refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete review.")
    } finally { setBusy(false) }
  }
  function changePage(next: number) {
    if (next < 1 || next === page || busy) return
    setPage(next)
    setLoading(true)
  }
  const visibleOwnReview = reviews?.items.some((review) => review.id === mine?.id) ?? false
  return (
    <section aria-labelledby="anime-reviews-heading" className="space-y-5" id="reviews">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Community</p>
          <h2 id="anime-reviews-heading" className="mt-1 text-2xl font-bold tracking-tight">Reviews</h2>
          <p className="mt-1 text-sm text-muted-foreground">Share your thoughts on {animeTitle}.</p>
          {stats ? <p className="mt-2 text-sm font-medium">{stats.totalReviews} reviews · Average {reviewScoreLabel(stats.averageScore)} ({stats.scoredReviews} ratings)</p> : null}
        </div>
        <button type="button" onClick={refresh} disabled={loading || busy} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface disabled:opacity-50">
          <RefreshCw aria-hidden="true" className={`size-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>
      {message ? <p role="status" className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">{message}</p> : null}
      {error ? <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
      <div id="review-editor" className="scroll-mt-28">
        {status === "loading" ? <p className="text-sm text-muted-foreground">Checking your session…</p> : authenticated ? (
          editingId || (!mine && !loading) ? (
            <ReviewForm draft={draft} setDraft={setDraft} submitting={busy} editing={editingId !== null}
              cancel={cancelEdit} submit={(event) => { void submitReview(event) }} />
          ) : mine && !editingId ? (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
              <p className="font-medium">You already reviewed this anime.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" disabled={busy} onClick={() => startEdit(mine)} className="rounded-lg bg-primary px-3 py-2 font-medium text-primary-foreground disabled:opacity-50">Edit your review</button>
                <button type="button" disabled={busy} onClick={() => { void removeReview(mine) }} className="rounded-lg border border-destructive/40 px-3 py-2 text-destructive disabled:opacity-50">Delete review</button>
              </div>
            </div>
          ) : null
        ) : (
          <div className="rounded-xl border border-border bg-surface p-5 text-sm text-muted-foreground">
            <Link href="/login" className="font-semibold text-primary hover:underline">Sign in</Link> to write your own review.
          </div>
        )}
      </div>
      {loading ? <p role="status" className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted-foreground">Loading reviews…</p> : reviews?.items.length ? (
        <>
          <div className="space-y-3">
            {reviews.items.map((item) => <ReviewEntry key={item.id} item={item} mine={authenticated && user?.id === item.userId}
              busy={busy} onEdit={startEdit} onDelete={(review) => { void removeReview(review) }} />)}
          </div>
          {mine && !visibleOwnReview ? <p className="text-xs text-muted-foreground">Your review is on another page. Use the editor above to manage it.</p> : null}
          <div className="flex items-center justify-between gap-3 pt-2 text-sm">
            <button type="button" disabled={!reviews.pageInfo.hasPreviousPage || busy} onClick={() => changePage(page - 1)} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 disabled:opacity-40">
              <ChevronLeft aria-hidden="true" className="size-4" /> Previous
            </button>
            <span className="text-muted-foreground">Page {reviews.pageInfo.page} of {Math.max(1, reviews.pageInfo.pageCount)}</span>
            <button type="button" disabled={!reviews.pageInfo.hasNextPage || busy} onClick={() => changePage(page + 1)} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 disabled:opacity-40">
              Next <ChevronRight aria-hidden="true" className="size-4" />
            </button>
          </div>
        </>
      ) : !error ? <p className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted-foreground">No reviews yet. Be the first to share your thoughts.</p> : null}
    </section>
  )
}
