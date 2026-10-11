'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { fetchAdminCatalogPage, type AdminCatalogAge, type AdminCatalogResult, type AdminCatalogStatus } from '@/lib/graphql/admin-catalog';
import { createAdminAnimeCandidate, fetchAdminAnimeCandidates, updateAdminAnimeCandidate,
  type AdminAnimeCandidate, type AdminAnimeCandidatePage, type AnimeCandidateDraft } from '@/lib/graphql/admin-anime-candidates';

const panel = 'rounded-2xl border border-border bg-surface p-4 sm:p-5';
const control = 'min-h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-primary';
const emptyDraft: AnimeCandidateDraft = { sourceName: '', sourceReference: '', synopsis: '' };

export function AdminAnimeManager() {
  const { status, user } = useAuth();
  const authorized = status === 'authenticated' && user?.role === 'ADMIN';
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [catalogStatus, setCatalogStatus] = useState<AdminCatalogStatus | 'ALL'>('ALL');
  const [age, setAge] = useState<AdminCatalogAge | 'ALL'>('ALL');
  const [animePage, setAnimePage] = useState(1);
  const [candidatePage, setCandidatePage] = useState(1);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [onlyMine, setOnlyMine] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [animeState, setAnimeState] = useState<{key: string; data?: AdminCatalogResult; error?: string}|null>(null);
  const [candidateState, setCandidateState] = useState<{key: string; data?: AdminAnimeCandidatePage; error?: string}|null>(null);
  const [editing, setEditing] = useState<AdminAnimeCandidate|null>(null);
  const [draft, setDraft] = useState<AnimeCandidateDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const animeKey = JSON.stringify({search,catalogStatus,age,animePage,refresh});
  const candidateKey = JSON.stringify({candidatePage,candidateSearch,onlyMine,refresh});

  useEffect(() => {
    if (!authorized) return;
    let active = true;
    void fetchAdminCatalogPage({page:animePage,perPage:20, ...(search ? {search}:{}),
      ...(catalogStatus!=='ALL'?{status:catalogStatus}:{}), ...(age!=='ALL'?{age}: {})})
      .then(data => {if(active)setAnimeState({key:animeKey,data});})
      .catch(() => {if(active)setAnimeState({key:animeKey,error:'Anime catalogue is unavailable.'});});
    return () => {active=false;};
  },[authorized,animeKey,animePage,search,catalogStatus,age]);

  useEffect(() => {
    if (!authorized) return;
    let active = true;
    void fetchAdminAnimeCandidates({page:candidatePage,perPage:20,onlyMine,
      ...(candidateSearch.trim()?{search:candidateSearch.trim().slice(0,120)}:{})})
      .then(data => {if(active)setCandidateState({key:candidateKey,data});})
      .catch(() => {if(active)setCandidateState({key:candidateKey,error:'Candidate staging is unavailable. Its database migration may still be pending.'});});
    return () => {active=false;};
  },[authorized,candidateKey,candidatePage,candidateSearch,onlyMine]);

  if(status==='loading') return <main role="status" className="mx-auto max-w-6xl px-4 py-12">Checking admin session…</main>;
  if(status==='error') return <main role="alert" className="mx-auto max-w-6xl px-4 py-12">Cannot verify your session.</main>;
  if(!authorized) return <main className="mx-auto max-w-6xl space-y-3 px-4 py-12"><h1 className="text-2xl font-bold">ADMIN required</h1><p>No private anime management access.</p><Link className="underline text-primary" href="/login">Sign in</Link></main>;
  const currentAnime = animeState?.key === animeKey ? animeState : null;
  const currentCandidates = candidateState?.key === candidateKey ? candidateState : null;

  function startEdit(item: AdminAnimeCandidate) {
    if (!item.editable || item.synopsis === null) return;
    setEditing(item); setDraft({sourceName:item.sourceName,sourceReference:item.sourceReference,synopsis:item.synopsis});
    setSaveError('');setSavedMessage('');
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if(saving) return;
    setSaving(true);setSaveError('');setSavedMessage('');
    try {
      if(editing) await updateAdminAnimeCandidate({...draft,candidateId:editing.id,expectedUpdatedAt:editing.updatedAt});
      else await createAdminAnimeCandidate(draft);
      setEditing(null);setDraft(emptyDraft);setSavedMessage('Quarantined draft saved. No canonical or public data was changed.');
      setCandidatePage(1);setRefresh(n=>n+1);
    } catch(e) {setSaveError(e instanceof Error ? e.message : 'Could not save candidate.');}
    finally{setSaving(false);}
  }
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-10 pb-24 sm:px-6">
    <header className="space-y-2"><Link className="text-sm text-primary underline" href="/admin/catalog">← Admin catalog</Link>
      <h1 className="text-3xl font-bold tracking-tight">Anime Manager</h1>
      <p className="max-w-3xl text-sm text-muted-foreground">Canonical Anime is read only here. Candidate drafts are private, quarantined and unverified until separate human evidence and editorial review.</p>
    </header>
    <section className={panel} aria-label="Canonical Anime catalogue">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Canonical Anime · read only</h2>
        <button type="button" className={control} onClick={()=>setRefresh(n=>n+1)}>Refresh</button></div>
      <form className="flex flex-wrap items-end gap-3" onSubmit={e=>{e.preventDefault();setSearch(searchDraft.trim().slice(0,120));setAnimePage(1);}}>
        <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm">Search title / slug<input className={control} maxLength={120} value={searchDraft} onChange={e=>setSearchDraft(e.target.value)}/></label>
        <button type="submit" className={control}>Search</button>
        <label className="flex flex-col gap-1 text-sm">Status<select className={control} value={catalogStatus} onChange={e=>{setCatalogStatus(e.target.value as AdminCatalogStatus|'ALL');setAnimePage(1);}}><option value="ALL">All</option><option value="REVIEW">Review</option><option value="INCLUDED">Included</option><option value="EXCLUDED">Excluded</option></select></label>
        <label className="flex flex-col gap-1 text-sm">Age<select className={control} value={age} onChange={e=>{setAge(e.target.value as AdminCatalogAge|'ALL');setAnimePage(1);}}><option value="ALL">All</option><option value="UNKNOWN">Unknown</option><option value="NON_ADULT">Non-adult</option><option value="ADULT">Adult</option></select></label>
      </form>
      {!currentAnime?<p role="status" className="py-5 text-sm text-muted-foreground">Loading Anime records…</p>:null}
      {currentAnime?.error?<p role="alert" className="py-4 text-sm text-destructive">{currentAnime.error}</p>:null}
      {currentAnime?.data?<><p className="mt-4 text-xs text-muted-foreground">{currentAnime.data.pageInfo.total.toLocaleString()} results · page {currentAnime.data.pageInfo.page}</p>
        <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[580px] text-left text-sm"><thead><tr className="border-b border-border text-muted-foreground"><th className="py-2">Title</th><th>Status</th><th>Age</th><th>Action</th></tr></thead><tbody>
          {currentAnime.data.items.map(a=><tr className="border-b border-border/50" key={a.id}><td className="py-3 pr-3"><span className="font-medium">{a.title}</span><p className="text-xs text-muted-foreground">{a.slug}</p></td><td>{a.catalogStatus}</td><td>{a.isAdult===null?'Unknown':a.isAdult?'Adult':'Non-adult'}</td><td><Link className="text-primary underline" href={`/admin/catalog/synopsis?animeId=${encodeURIComponent(a.id)}`}>Legacy synopsis draft</Link></td></tr>)}
        </tbody></table></div>
        {currentAnime.data.items.length===0?<p role="status" className="py-4 text-sm">No anime matches these filters.</p>:null}
        <nav aria-label="Anime pages" className="mt-4 flex items-center justify-end gap-3"><button className={control} type="button" disabled={!currentAnime.data.pageInfo.hasPreviousPage} onClick={()=>setAnimePage(p=>Math.max(1,p-1))}>Previous</button><button className={control} type="button" disabled={!currentAnime.data.pageInfo.hasNextPage} onClick={()=>setAnimePage(p=>p+1)}>Next</button></nav>
      </>:null}
    </section>
    <section className={panel} aria-label="Quarantined Anime candidate editor">
      <h2 className="text-xl font-semibold">{editing?'Edit my quarantined candidate':'Create private candidate'}</h2>
      <p className="mt-2 text-sm text-muted-foreground">Manual proposal only. Enter your own synopsis and a traceable source reference. This is not verified provenance, a license grant, or publication.</p>
      <form className="mt-4 grid gap-3" onSubmit={save}>
        <label className="grid gap-1 text-sm">Source name<input className={control} required maxLength={150} value={draft.sourceName} onChange={e=>setDraft(d=>({...d,sourceName:e.target.value}))}/></label>
        <label className="grid gap-1 text-sm">Source reference<input className={control} required maxLength={500} value={draft.sourceReference} onChange={e=>setDraft(d=>({...d,sourceReference:e.target.value}))}/></label>
        <label className="grid gap-1 text-sm">Proposed synopsis<textarea className={control} required rows={5} maxLength={10000} value={draft.synopsis} onChange={e=>setDraft(d=>({...d,synopsis:e.target.value}))}/></label>
        {editing?<p className="text-xs text-muted-foreground">Updating candidate {editing.id}. Concurrent changes and editorial-linked candidates cannot be overwritten.</p>:null}
        {saveError?<p role="alert" className="text-sm text-destructive">{saveError}</p>:null}
        {savedMessage?<p role="status" className="text-sm text-muted-foreground">{savedMessage}</p>:null}
        <div className="flex flex-wrap gap-3"><button className={`${control} bg-primary text-primary-foreground disabled:opacity-50`} type="submit" disabled={saving}>{saving?'Saving…':editing?'Update private draft':'Save quarantined draft'}</button>
          {editing?<button className={control} type="button" disabled={saving} onClick={()=>{setEditing(null);setDraft(emptyDraft);setSaveError('');}}>Cancel edit</button>:null}</div>
      </form>
    </section>
    <section className={panel} aria-label="Private Anime candidate list">
      <h2 className="text-xl font-semibold">Staged Anime candidates</h2>
      <div className="mt-3 flex flex-wrap items-center gap-3"><label className="text-sm">Search staging <input className={control} maxLength={120} value={candidateSearch} onChange={e=>{setCandidateSearch(e.target.value);setCandidatePage(1);}}/></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyMine} onChange={e=>{setOnlyMine(e.target.checked);setCandidatePage(1);}}/> Only my candidates</label></div>
      {!currentCandidates?<p role="status" className="py-5 text-sm text-muted-foreground">Loading quarantined candidates…</p>:null}
      {currentCandidates?.error?<p role="alert" className="py-4 text-sm text-muted-foreground">{currentCandidates.error}</p>:null}
      {currentCandidates?.data?<><p className="mt-3 text-xs text-muted-foreground">{currentCandidates.data.total} candidates · page {currentCandidates.data.page}</p>
        {currentCandidates.data.items.length===0?<p role="status" className="py-4 text-sm">No candidates found.</p>:null}
        <ul className="mt-3 space-y-2">{currentCandidates.data.items.map(item=><li className="rounded-lg border border-border p-3" key={item.id}><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{item.sourceName}</p><p className="break-all text-xs text-muted-foreground">{item.sourceReference}</p><p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm">{item.synopsis??'[Unsupported proposal]'}</p><p className="mt-1 text-xs text-muted-foreground">{item.isQuarantined?'Quarantined':'Not quarantined'} · {item.editable?'Editable private draft':'Locked / not yours'}</p></div>
        {item.editable&&item.synopsis!==null?<button type="button" className={control} onClick={()=>startEdit(item)}>Edit</button>:null}</div></li>)}</ul>
        <nav className="mt-4 flex items-center justify-end gap-3" aria-label="Candidate pages"><button className={control} disabled={candidatePage<=1} type="button" onClick={()=>setCandidatePage(p=>Math.max(1,p-1))}>Previous</button><button className={control} disabled={!currentCandidates.data.hasNextPage} type="button" onClick={()=>setCandidatePage(p=>p+1)}>Next</button></nav>
      </>:null}
    </section>
  </main>;
}
