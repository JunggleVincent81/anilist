'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { fetchAdminSynopsisReviewQueue, reviewAdminSynopsisSubmission, type AdminSynopsisQueuePage, type AdminSynopsisQueueItem } from '@/lib/graphql/admin-synopsis-workflow';

function ReviewItem({ item, currentUserId, onCompleted }: { item: AdminSynopsisQueueItem; currentUserId: string; onCompleted: () => void }) {
  const [action, setAction] = useState<'REQUEST_CHANGES' | 'REJECT'>('REQUEST_CHANGES');
  const [note, setNote] = useState('');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const own = item.creatorId === currentUserId;
  async function act() {
    if (own || note.trim().length < 5 || note.trim().length > 2000) return;
    setWorking(true); setError('');
    try { await reviewAdminSynopsisSubmission({ draftId: item.id, expectedRevision: item.revision, action, note: note.trim() }); onCompleted(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Review failed. Refresh before retrying.'); }
    finally { setWorking(false); }
  }
  return <article className="space-y-3 rounded-xl border border-border bg-surface p-4">
    <header><h2 className="font-semibold">Anime <code className="break-all">{item.animeId}</code></h2><p className="text-xs text-muted-foreground">Submission {item.id} · revision {item.revision} · {item.state}</p></header>
    <p className="whitespace-pre-wrap break-words rounded-lg bg-background p-3 text-sm">{item.synopsis}</p>
    {item.reason ? <p className="break-words text-sm text-muted-foreground">Reason: {item.reason}</p> : null}
    {own ? <p className="text-sm text-muted-foreground">You cannot review your own submission.</p> : <div className="space-y-2">
      <label className="block text-sm">Decision <select aria-label={`Decision for ${item.id}`} className="ml-2 rounded-md border border-border bg-background p-2" value={action} onChange={(e) => setAction(e.target.value as 'REQUEST_CHANGES' | 'REJECT')} disabled={working}><option value="REQUEST_CHANGES">Request changes</option><option value="REJECT">Reject</option></select></label>
      <label className="block text-sm">Review note (5–2000 characters)<textarea className="mt-1 block w-full rounded-md border border-border bg-background p-3" value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} disabled={working} rows={3}/></label>
      <button type="button" disabled={working || note.trim().length < 5} onClick={act} className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">{working ? 'Submitting…' : 'Record decision'}</button>
    </div>}
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
  </article>;
}

export function AdminSynopsisReviewQueue() {
  const { user, status } = useAuth();
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [data, setData] = useState<AdminSynopsisQueuePage | null>(null);
  const [error, setError] = useState('');
  const authorized = status === 'authenticated' && user?.role === 'ADMIN';
  useEffect(() => {
    if (!authorized) return;
    let active = true;
    void fetchAdminSynopsisReviewQueue(page).then((result) => { if (active) { setData(result); setError(''); } })
      .catch((err: unknown) => { if (active) { setData(null); setError(err instanceof Error ? err.message : 'Review queue unavailable.'); } });
    return () => { active = false; };
  }, [authorized, page, refresh]);
  if (status === 'loading') return <p role="status">Checking administrator session…</p>;
  if (!authorized) return <p role="alert">Administrator access required. <Link className="underline" href="/login">Sign in</Link></p>;
  return <main className="mx-auto max-w-4xl space-y-5 px-4 py-10 pb-24">
    <header className="space-y-2"><Link href="/admin/catalog" className="text-primary underline">← Back to catalog</Link><h1 className="text-2xl font-bold">Private synopsis review queue</h1><p className="text-sm text-muted-foreground">Review decisions are private and never publish catalog changes. Approval is disabled.</p></header>
    <button type="button" onClick={() => { setData(null); setRefresh((n) => n + 1); }} className="rounded-md border border-border px-3 py-2">Refresh</button>
    {error ? <p role="alert" className="text-destructive">{error}</p> : null}
    {!data && !error ? <p role="status">Loading submissions…</p> : null}
    {data?.items.length === 0 ? <p role="status">No submitted synopses are awaiting review.</p> : null}
    {data?.items.map((item) => <ReviewItem key={`${item.id}-${item.revision}`} item={item} currentUserId={user!.id} onCompleted={() => { setData(null); setRefresh((n) => n + 1); }}/>) }
    {data ? <nav aria-label="Review queue pagination" className="flex items-center justify-between gap-3 text-sm"><button type="button" disabled={page <= 1} onClick={() => { setData(null); setPage((p) => p - 1); }} className="disabled:opacity-40">Previous</button><span>Page {data.page} · {data.total} submitted</span><button type="button" disabled={!data.hasNextPage} onClick={() => { setData(null); setPage((p) => p + 1); }} className="disabled:opacity-40">Next</button></nav> : null}
  </main>;
}
