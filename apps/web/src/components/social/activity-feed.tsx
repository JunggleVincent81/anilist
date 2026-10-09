"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import { Heart, LoaderCircle, MessageCircle, RefreshCw, Send } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import {
  fetchActivityFeed,
  fetchActivityReplies,
  postActivityReply,
  postTextActivity,
  setActivityLike,
  type Activity,
  type ActivityPage,
  type ActivityReply,
} from "@/lib/graphql/activity-feed"
import {
  MAX_ACTIVITY_TEXT,
  cleanActivityText,
  type ActivityFeedScope,
} from "@/lib/graphql/activity-feed.contract"

function displayTime(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "Recently" : date.toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

function ActivityCard({
  activity, canInteract, liked, onLike, onReply, repliesOpen, replies,
  replyDraft, setReplyDraft, sendReply, busy,
}: {
  activity: Activity
  canInteract: boolean
  liked: boolean
  onLike: (id: string) => void
  onReply: (id: string) => void
  repliesOpen: boolean
  replies: ActivityReply[] | undefined
  replyDraft: string
  setReplyDraft: (text: string) => void
  sendReply: (id: string) => void
  busy: boolean
}) {
  const actorName = activity.actor.displayName || activity.actor.username
  return (
    <article className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-3">
        <div aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary">
          {actorName.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <Link href={`/user/${encodeURIComponent(activity.actor.username)}`} className="font-semibold hover:text-primary hover:underline">
            {actorName}
          </Link>
          <p className="text-xs text-muted-foreground">@{activity.actor.username} · {displayTime(activity.createdAt)}</p>
        </div>
      </div>
      {activity.text ? (
        <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 sm:text-base">{activity.text}</p>
      ) : null}
      {activity.anime ? (
        <Link href={`/anime/${encodeURIComponent(activity.anime.slug)}`} className="mt-4 block rounded-xl border border-border bg-background/50 px-4 py-3 text-sm hover:border-primary/50">
          <span className="font-medium">{activity.anime.title}</span>
          <span className="mt-1 block text-xs text-muted-foreground">
            {activity.animeStatus ? activity.animeStatus.replaceAll("_", " ") : "Anime update"}
            {activity.progressEpisodes !== null ? ` · Episode ${activity.progressEpisodes}` : ""}
          </span>
        </Link>
      ) : null}
      {activity.achievement ? (
        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">🏆 {activity.achievement.name}</div>
      ) : null}
      {!activity.text && !activity.anime && !activity.achievement ? (
        <p className="mt-4 text-sm text-muted-foreground">{activity.type.replaceAll("_", " ")}</p>
      ) : null}
      <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border pt-3 text-sm text-muted-foreground">
        <button type="button" disabled={!canInteract || busy} aria-label={liked ? "Unlike activity" : "Like activity"} aria-pressed={liked}
          className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => onLike(activity.id)}>
          <Heart aria-hidden="true" className={`size-4 ${liked ? "fill-current text-primary" : ""}`} />
          <span>{activity.likeCount} {liked ? "Liked" : "Like"}</span>
        </button>
        <button type="button" disabled={busy} aria-expanded={repliesOpen}
          className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 hover:text-primary disabled:opacity-50"
          onClick={() => onReply(activity.id)}>
          <MessageCircle aria-hidden="true" className="size-4" />
          <span>{activity.replyCount} Replies</span>
        </button>
      </div>
      {repliesOpen ? (
        <section className="mt-3 space-y-3 border-t border-border pt-4" aria-label="Activity replies">
          {replies === undefined ? <p role="status" className="text-sm text-muted-foreground">Loading replies…</p> : null}
          {replies?.length === 0 ? <p className="text-sm text-muted-foreground">No replies yet.</p> : null}
          {replies?.map((reply) => (
            <div key={reply.id} className="rounded-xl bg-background px-4 py-3">
              <p className="text-xs text-muted-foreground">
                <Link href={`/user/${encodeURIComponent(reply.author.username)}`} className="font-semibold text-foreground hover:underline">
                  {reply.author.displayName || reply.author.username}
                </Link> · {displayTime(reply.createdAt)}
              </p>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm">{reply.body}</p>
            </div>
          ))}
          {canInteract ? (
            <form onSubmit={(event) => { event.preventDefault(); sendReply(activity.id) }} className="flex gap-2">
              <label htmlFor={`reply-${activity.id}`} className="sr-only">Write a reply</label>
              <input id={`reply-${activity.id}`} value={replyDraft} maxLength={MAX_ACTIVITY_TEXT} onChange={(event) => setReplyDraft(event.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-primary"
                placeholder="Write a reply…" />
              <button type="submit" disabled={busy || !replyDraft.trim()} aria-label="Send reply" className="rounded-lg bg-primary px-3 text-primary-foreground disabled:opacity-50">
                <Send aria-hidden="true" className="size-4" />
              </button>
            </form>
          ) : <Link href="/login" className="text-sm text-primary hover:underline">Sign in to reply</Link>}
        </section>
      ) : null}
    </article>
  )
}

export function ActivityFeed() {
  const { user, status } = useAuth()
  const authenticated = status === "authenticated" && user !== null
  const [scope, setScope] = useState<ActivityFeedScope>("public")
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [feed, setFeed] = useState<ActivityPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState("")
  const [posting, setPosting] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [likedIds, setLikedIds] = useState<Set<string>>(() => new Set())
  const [openReplies, setOpenReplies] = useState<string | null>(null)
  const [replies, setReplies] = useState<Record<string, ActivityReply[]>>({})
  const [replyDraft, setReplyDraft] = useState("")

  const refresh = useCallback(() => {
    setLoading(true)
    setReloadKey((key) => key + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    if (scope === "following" && !authenticated) {
      // Asynchronous state update also handles the initial auth-loading transition.
      queueMicrotask(() => {
        if (!cancelled) { setFeed(null); setLoading(false) }
      })
      return () => { cancelled = true }
    }
    void fetchActivityFeed(scope, page)
      .then((result) => {
        if (cancelled) return
        setFeed(result)
        setError(null)
        setLoading(false)
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setFeed(null)
        setError(cause instanceof Error ? cause.message : "Could not load activity.")
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [scope, page, reloadKey, authenticated])

  function selectScope(next: ActivityFeedScope) {
    if (next === scope) return
    setScope(next)
    setPage(1)
    setOpenReplies(null)
    setReplies({})
    setError(null)
    setLoading(true)
  }

  function changePage(next: number) {
    if (next < 1 || next === page) return
    setPage(next)
    setOpenReplies(null)
    setReplies({})
    setLoading(true)
  }

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!authenticated || posting) return
    try {
      const text = cleanActivityText(draft)
      setPosting(true)
      setError(null)
      await postTextActivity(text)
      setDraft("")
      setScope("public")
      setPage(1)
      refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not publish post.")
    } finally { setPosting(false) }
  }

  async function toggleLike(id: string) {
    if (!authenticated || busyId) return
    const nextLiked = !likedIds.has(id)
    setBusyId(id)
    setError(null)
    try {
      await setActivityLike(id, nextLiked)
      setLikedIds((existing) => {
        const updated = new Set(existing)
        if (nextLiked) updated.add(id)
        else updated.delete(id)
        return updated
      })
      refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update like.")
    } finally { setBusyId(null) }
  }

  async function toggleReplies(id: string) {
    if (openReplies === id) { setOpenReplies(null); return }
    setOpenReplies(id)
    setReplyDraft("")
    if (replies[id] !== undefined) return
    try {
      const items = await fetchActivityReplies(id)
      setReplies((existing) => ({ ...existing, [id]: items }))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load replies.")
      setOpenReplies(null)
    }
  }

  async function submitReply(id: string) {
    if (!authenticated || busyId) return
    try {
      const text = cleanActivityText(replyDraft)
      setBusyId(id)
      setError(null)
      await postActivityReply(id, text)
      const items = await fetchActivityReplies(id)
      setReplies((existing) => ({ ...existing, [id]: items }))
      setReplyDraft("")
      refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not send reply.")
    } finally { setBusyId(null) }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Your anime community</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Activity feed</h1>
          <p className="mt-2 text-sm text-muted-foreground">See what everyone is watching, celebrating, and sharing.</p>
        </div>
        <button type="button" onClick={refresh} disabled={loading} aria-label="Refresh feed"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface disabled:opacity-50">
          <RefreshCw aria-hidden="true" className={`size-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {authenticated ? (
        <form onSubmit={(event) => { void publish(event) }} className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <label htmlFor="activity-draft" className="block font-semibold">Share an update</label>
          <textarea id="activity-draft" value={draft} maxLength={MAX_ACTIVITY_TEXT}
            onChange={(event) => setDraft(event.target.value)} rows={3} placeholder="What anime is on your mind?"
            className="mt-3 w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm leading-6 focus-visible:outline-2 focus-visible:outline-primary" />
          <div className="mt-3 flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">{draft.length}/{MAX_ACTIVITY_TEXT}</span>
            <button type="submit" disabled={posting || !draft.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
              {posting ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Send aria-hidden="true" className="size-4" />}
              {posting ? "Publishing…" : "Publish"}
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted-foreground">
          <Link href="/login" className="font-semibold text-primary hover:underline">Sign in</Link> to share updates, like posts, and reply.
        </div>
      )}

      <nav aria-label="Feed type" className="flex gap-2 border-b border-border pb-3">
        <button type="button" aria-current={scope === "public" ? "page" : undefined} onClick={() => selectScope("public")}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${scope === "public" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface"}`}>Everyone</button>
        <button type="button" aria-current={scope === "following" ? "page" : undefined} disabled={status === "loading"}
          onClick={() => selectScope("following")}
          className={`rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 ${scope === "following" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface"}`}>Following</button>
      </nav>

      {error ? <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{error}</p> : null}
      {scope === "following" && !authenticated ? (
        <p className="rounded-xl border border-border bg-surface p-6 text-sm text-muted-foreground">Sign in to see updates from users you follow. <Link href="/login" className="text-primary underline">Sign in</Link></p>
      ) : loading ? (
        <div role="status" aria-live="polite" className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted-foreground">Loading activity…</div>
      ) : !feed || feed.items.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted-foreground">Nothing here yet. {scope === "public" ? "Be the first to share an update!" : "Follow other anime fans to fill your feed."}</div>
      ) : (
        <div className="space-y-4">
          {feed.items.map((item) => (
            <ActivityCard key={item.id} activity={item} canInteract={authenticated} liked={likedIds.has(item.id)}
              onLike={(id) => { void toggleLike(id) }} onReply={(id) => { void toggleReplies(id) }}
              repliesOpen={openReplies === item.id} replies={replies[item.id]}
              replyDraft={openReplies === item.id ? replyDraft : ""} setReplyDraft={setReplyDraft}
              sendReply={(id) => { void submitReply(id) }} busy={busyId === item.id} />
          ))}
          <div className="flex items-center justify-between gap-4 pt-3 text-sm text-muted-foreground">
            <button type="button" disabled={!feed.pageInfo.hasPreviousPage || loading} onClick={() => changePage(page - 1)}
              className="rounded-lg border border-border px-4 py-2 hover:bg-surface disabled:opacity-40">Previous</button>
            <span>Page {feed.pageInfo.page} of {Math.max(1, feed.pageInfo.pageCount)}</span>
            <button type="button" disabled={!feed.pageInfo.hasNextPage || loading} onClick={() => changePage(page + 1)}
              className="rounded-lg border border-border px-4 py-2 hover:bg-surface disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
