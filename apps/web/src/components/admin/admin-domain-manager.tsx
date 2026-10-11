'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { fetchAdminDomainRecords } from '@/lib/graphql/admin-domain-records';
import type { AdminDomainKind, AdminPublicationFilter, AdminDomainRecordPage } from '@/lib/graphql/admin-domain-records';

const MANGA: {value:AdminDomainKind; label:string}[] = [
  {value:'MANGA_WORK',label:'Works'}, {value:'MANGA_VOLUME',label:'Volumes'}, {value:'MANGA_CHAPTER',label:'Chapters'},
];
const MUSIC: {value:AdminDomainKind; label:string}[] = [
  {value:'MUSIC_TRACK',label:'Tracks'}, {value:'MUSIC_ARTIST',label:'Artists'},
  {value:'MUSIC_RECORDING',label:'Recordings'}, {value:'MUSIC_RELEASE',label:'Releases'},
  {value:'MUSIC_RELEASE_TRACK',label:'Release tracks'}, {value:'MUSIC_CREDIT',label:'Credits'},
];
const control = 'min-h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-primary';
const panel = 'rounded-2xl border border-border bg-surface p-4 sm:p-5';

export function AdminDomainManager({kind}:{kind:'MANGA'|'MUSIC'}) {
  const {user,status} = useAuth();
  const authorized = status === 'authenticated' && user?.role === 'ADMIN';
  const choices = kind === 'MANGA' ? MANGA : MUSIC;
  const [domain,setDomain] = useState<AdminDomainKind>(kind === 'MANGA' ? 'MANGA_WORK' : 'MUSIC_TRACK');
  const [draftSearch,setDraftSearch] = useState('');
  const [search,setSearch] = useState('');
  const [publication,setPublication] = useState<AdminPublicationFilter>('ALL');
  const [page,setPage] = useState(1);
  const [refresh,setRefresh] = useState(0);
  const [snapshot,setSnapshot] = useState<{key:string; data?:AdminDomainRecordPage; error?:string}|null>(null);
  const key = JSON.stringify({domain,search,publication,page,refresh});

  useEffect(() => {
    if (!authorized) return;
    let active=true;
    void fetchAdminDomainRecords({domain, page, perPage:20, ...(search?{search}:{}), publication})
      .then(data => {if(active)setSnapshot({key,data});})
      .catch(() => {if(active)setSnapshot({key,error:'Canonical inventory could not be loaded. Try again or check database access.'});});
    return () => {active=false;};
  },[authorized,key,domain,page,search,publication]);

  if(status === 'loading') return <main role="status" className="mx-auto max-w-6xl px-4 py-12">Checking administrator session…</main>;
  if(status === 'error') return <main role="alert" className="mx-auto max-w-6xl px-4 py-12">Cannot verify your session.</main>;
  if(!authorized) return <main className="mx-auto max-w-6xl space-y-2 px-4 py-12"><h1 className="text-2xl font-bold">Administrator access required</h1><p>Private catalogue management is not available for this account.</p><Link href="/login" className="text-primary underline">Sign in</Link></main>;

  const current = snapshot?.key === key ? snapshot : null;
  const data = current?.data;
  function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSearch(draftSearch.trim().slice(0,120)); setPage(1);
  }
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-10 pb-24 sm:px-6">
    <header className="space-y-2">
      <Link href="/admin/catalog" className="text-sm text-primary underline">← Admin catalog</Link>
      <h1 className="text-3xl font-bold tracking-tight">{kind === 'MANGA' ? 'Manga Manager' : 'Music Manager'}</h1>
      <p className="max-w-3xl text-sm text-muted-foreground">Private canonical inventory for catalog curators. This view cannot edit, unquarantine or publish any record. Domain editors and draft import are separate steps.</p>
      <nav className="flex flex-wrap gap-3 pt-2 text-sm" aria-label="Domain managers">
        <Link href="/admin/catalog/manga" className="text-primary underline">Manga Manager</Link>
        <Link href="/admin/catalog/music" className="text-primary underline">Music Manager</Link>
        <Link href="/admin/catalog/anime" className="text-primary underline">Anime Manager</Link>
      </nav>
    </header>
    <section className={panel} aria-label={`${kind} canonical records`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{kind === 'MANGA' ? 'Manga structures' : 'Music structures'}</h2>
        <button className={control} type="button" onClick={()=>setRefresh(n=>n+1)}>Refresh</button>
      </div>
      <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={submit}>
        <label className="flex min-w-36 flex-col gap-1 text-sm">Record type
          <select className={control} value={domain} onChange={e=>{setDomain(e.target.value as AdminDomainKind);setPage(1);}}>
            {choices.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </label>
        <label className="flex min-w-44 flex-1 flex-col gap-1 text-sm">Search title / key
          <input className={control} maxLength={120} placeholder="Search canonical metadata" value={draftSearch} onChange={e=>setDraftSearch(e.target.value)}/>
        </label>
        <button className={control} type="submit">Search</button>
        <label className="flex flex-col gap-1 text-sm">Publication flag
          <select className={control} value={publication} onChange={e=>{setPublication(e.target.value as AdminPublicationFilter);setPage(1);}}>
            <option value="ALL">All</option><option value="PRIVATE">Private</option><option value="PUBLISHED">Marked published</option>
          </select>
        </label>
      </form>
      {!current?<p role="status" className="py-6 text-sm text-muted-foreground">Loading {kind} records…</p>:null}
      {current?.error?<p role="alert" className="py-5 text-sm text-destructive">{current.error}</p>:null}
      {data && !data.available ? <div role="status" className="mt-5 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        {kind} tables are unavailable (pending migration or unsupported schema). No zero-record assumption is made. No database migrations were executed.
      </div> : null}
      {data?.available ? <>
        <p className="mt-4 text-sm text-muted-foreground">{(data.total ?? 0).toLocaleString()} records · page {data.page}</p>
        {data.items.length===0?<p role="status" className="py-6 text-sm text-muted-foreground">No records match these filters.</p>:null}
        {data.items.length>0?<div className="mt-3 overflow-x-auto"><table className="w-full min-w-[690px] text-left text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground"><tr>
            <th className="px-2 py-3" scope="col">Record</th><th className="px-2 py-3" scope="col">Source</th>
            <th className="px-2 py-3" scope="col">Publication</th><th className="px-2 py-3" scope="col">Age</th>
          </tr></thead><tbody>
          {data.items.map(item=><tr className="border-b border-border/60 align-top" key={item.id}>
            <td className="px-2 py-3"><p className="font-medium">{item.title}</p>
              <p className="mt-1 break-all text-xs text-muted-foreground">{item.subtitle || item.id}</p>
              {item.relatedId?<p className="mt-1 break-all text-xs text-muted-foreground">Related ID: {item.relatedId}</p>:null}
            </td>
            <td className="px-2 py-3"><p>{item.sourceName || 'Not stored on this model'}</p>
              <p className="mt-1 max-w-64 break-all text-xs text-muted-foreground">{item.sourceReference || '—'}</p></td>
            <td className="px-2 py-3">{item.isPublished?'Flagged published':'Private'}</td>
            <td className="px-2 py-3">{item.isAdult===null?'Unknown / not applicable':item.isAdult?'Adult':'Non-adult'}</td>
          </tr>)}</tbody></table></div>:null}
        <nav className="mt-5 flex justify-end gap-3" aria-label="Canonical record pagination">
          <button className={control} type="button" disabled={page<=1} onClick={()=>setPage(n=>Math.max(1,n-1))}>Previous</button>
          <button className={control} type="button" disabled={!data.hasNextPage} onClick={()=>setPage(n=>n+1)}>Next</button>
        </nav>
      </>:null}
    </section>
    <p className="text-xs text-muted-foreground">A database isPublished flag does not certify age, provenance or media rights. Audio streaming, publication mutations and canonical writes are intentionally absent.</p>
  </main>;
}
