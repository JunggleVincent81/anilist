'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { submitAdminSynopsisDraft } from '@/lib/graphql/admin-synopsis-workflow';
import { createAdminSynopsisDraft, loadAdminSynopsisDraft, updateAdminSynopsisDraft, type AdminSynopsisDraft } from '@/lib/graphql/admin-synopsis-draft';

const inputStyle = 'w-full min-h-10 rounded-lg border border-border bg-background px-3 py-2 text-foreground focus-visible:outline-2 focus-visible:outline-primary';
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function AdminSynopsisEditor({ animeId }: { animeId: string }) {
  const { user, status } = useAuth();
  const [draft, setDraft] = useState<AdminSynopsisDraft | null>(null);
  const [synopsis, setSynopsis] = useState('');
  const [reason, setReason] = useState('');
  const [lookupId, setLookupId] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const authorized = status === 'authenticated' && user?.role === 'ADMIN';

  if (status === 'loading') return <p role="status">Checking administrator session…</p>;
  if (!authorized) return <div role="alert">{status === 'authenticated' ? 'Administrator access only.' : 'Sign in as an administrator to access private drafts.'} <Link href="/login" className="underline">Sign in</Link></div>;
  if (!uuidPattern.test(animeId)) return <p role="alert">Invalid anime identifier. Return to the catalog.</p>;

  async function restore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(''); setMessage('');
    if (!uuidPattern.test(lookupId.trim())) { setError('Enter a valid draft UUID.'); return; }
    setPending(true);
    try {
      const loaded = await loadAdminSynopsisDraft(lookupId.trim());
      if (loaded.animeId !== animeId) { setError('This draft belongs to a different anime.'); return; }
      setSubmitted(false); setDraft(loaded); setSynopsis(loaded.synopsis); setReason(loaded.reason ?? '');
      setMessage('Private draft loaded.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load draft.'); }
    finally { setPending(false); }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(''); setMessage('');
    const cleaned = synopsis.trim();
    if (!cleaned || cleaned.length > 10000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(cleaned)) { setError('Synopsis must contain 1–10000 valid characters.'); return; }
    if (reason.length > 500) { setError('Reason cannot exceed 500 characters.'); return; }
    setPending(true);
    try {
      const saved = draft
        ? await updateAdminSynopsisDraft({ draftId: draft.id, expectedRevision: draft.revision, synopsis: cleaned, reason })
        : await createAdminSynopsisDraft({ animeId, synopsis: cleaned, reason });
      setSubmitted(false); setDraft(saved); setLookupId(saved.id); setSynopsis(saved.synopsis); setReason(saved.reason ?? '');
      setMessage('Saved as a private draft. The public anime catalog was not changed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Draft could not be saved.');
    } finally { setPending(false); }
  }

  async function submitForReview() {
    if (!draft || pending || submitted) return;
    setPending(true); setError(''); setMessage('');
    try {
      await submitAdminSynopsisDraft({ draftId: draft.id, expectedRevision: draft.revision });
      setSubmitted(true);
      setMessage('Submitted for private review. This draft can no longer be edited; no publication occurred.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Submission failed. Reload draft and retry.'); }
    finally { setPending(false); }
  }

  return <div className="space-y-6">
    <header className="space-y-2"><Link href="/admin/catalog" className="text-sm text-primary underline">← Back to catalog</Link><h1 className="text-2xl font-bold">Private synopsis draft</h1><p className="text-sm text-muted-foreground">Anime ID: <code className="break-all">{animeId}</code></p><p className="text-sm text-muted-foreground">Only you can reopen this draft using its ID. Drafts are never published automatically.</p></header>
    <form onSubmit={restore} className="space-y-2 rounded-xl border border-border p-4"><label htmlFor="draft-id" className="block text-sm font-medium">Reopen an existing draft ID</label><div className="flex flex-wrap gap-2"><input id="draft-id" className={`${inputStyle} min-w-60 flex-1`} value={lookupId} onChange={(event) => setLookupId(event.target.value)} placeholder="Draft UUID" /><button type="submit" disabled={pending} className="rounded-lg border border-border px-4 py-2 disabled:opacity-50">Load draft</button></div></form>
    <form onSubmit={save} className="space-y-4 rounded-xl border border-border p-4"><label htmlFor="synopsis" className="block text-sm font-medium">Original Indonesian synopsis</label><textarea id="synopsis" className={`${inputStyle} min-h-60`} value={synopsis} maxLength={10000} onChange={(event) => setSynopsis(event.target.value)} required disabled={pending} aria-describedby="synopsis-counter" /><p id="synopsis-counter" className="text-xs text-muted-foreground">{synopsis.length}/10000 characters</p><label htmlFor="draft-reason" className="block text-sm font-medium">Editorial reason (optional)</label><textarea id="draft-reason" className={inputStyle} rows={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} disabled={pending} /><div className="flex flex-wrap items-center gap-3"><button className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50" disabled={pending || submitted} type="submit">{pending ? 'Working…' : draft ? 'Save revision' : 'Create private draft'}</button>{draft ? <p className="text-xs text-muted-foreground">Revision {draft.revision} · Draft ID: <code className="break-all select-all">{draft.id}</code></p> : null}</div></form>
    {draft ? <div className="rounded-xl border border-border p-4"><p className="mb-2 text-sm text-muted-foreground">Submitting locks the current saved revision. Save any unsaved edits first. Submission does not publish the synopsis.</p><button type="button" disabled={pending || submitted || synopsis.trim() !== draft.synopsis || reason.trim() !== (draft.reason ?? '')} onClick={submitForReview} className="rounded-lg border border-primary px-4 py-2 disabled:opacity-50">{submitted ? 'Submitted' : 'Submit saved draft for review'}</button></div> : null}
    {error ? <p role="alert" className="text-sm text-destructive">{error} {draft ? 'Reload the draft before retrying if another revision was saved.' : ''}</p> : null}
    {message ? <p role="status" className="text-sm text-foreground">{message}</p> : null}
  </div>;
}
