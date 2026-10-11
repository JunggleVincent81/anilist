'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { createAdminRelationProposal, fetchAdminCanonicalRelations, fetchAdminRelationProposals } from '@/lib/graphql/admin-relations';
import type { AdminRelationKind, AdminRelationEdge, AdminRelationProposal, AdminRelationPage } from '@/lib/graphql/admin-relations';

const KINDS:{value:AdminRelationKind;label:string;detail:string}[]=[
 {value:'ANIME_MANGA',label:'Anime ↔ Manga Work',detail:'Relation key: ADAPTATION, SOURCE_MATERIAL, SPIN_OFF, SIDE_STORY, RELATED, OTHER · details = {}'},
 {value:'ANIME_MUSIC_USAGE',label:'Anime ↔ Music Track',detail:'Usage key: e.g. OP01 · details = {"usageType":"OPENING","episodeStart":1,"episodeEnd":12}'},
 {value:'ANIME_EPISODE',label:'Anime → Episode (read only)',detail:'Episode already owns animeId; to change it, use the episode editorial workflow.'},
 {value:'MUSIC_RELEASE_TRACK',label:'Release ↔ Recording slot',detail:'Key is disc:track, e.g. 1:3 · details = {"discNumber":1,"trackNumber":3}'},
 {value:'MUSIC_CREDIT_TRACK',label:'Artist credit → Music Track',detail:'Key is PRIMARY_ARTIST:performer · details = {"creditKind":"PRIMARY_ARTIST","role":"Performer"}'},
 {value:'MUSIC_CREDIT_RECORDING',label:'Artist credit → Recording',detail:'Key is CONTRIBUTOR:composer · details = {"creditKind":"CONTRIBUTOR","role":"Composer"}'},
 {value:'MUSIC_CREDIT_RELEASE',label:'Artist credit → Release',detail:'Key is CONTRIBUTOR:producer · details = {"creditKind":"CONTRIBUTOR","role":"Producer"}'},
 {value:'MUSIC_CREDIT_RELEASE_TRACK',label:'Artist credit → Release Track',detail:'Key is CONTRIBUTOR:composer · details = {"creditKind":"CONTRIBUTOR","role":"Composer"}'},
];
const control='min-h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-40';
const card='rounded-2xl border border-border bg-surface p-4 sm:p-5';
const empty={sourceId:'',targetId:'',relationKey:'',detailsJson:'{}',sourceName:'',sourceReference:''};
type Data={kind:AdminRelationKind;page:number;refresh:number;onlyMine:boolean; canonical?:AdminRelationPage<AdminRelationEdge>;
 proposals?:AdminRelationPage<AdminRelationProposal>;error?:string};

export function AdminRelationManager(){
 const {user,status}=useAuth();
 const authorized=status==='authenticated' && user?.role==='ADMIN';
 const [kind,setKind]=useState<AdminRelationKind>('ANIME_MANGA');
 const [page,setPage]=useState(1),[refresh,setRefresh]=useState(0);
 const [onlyMine,setOnlyMine]=useState(true);
 const [draft,setDraft]=useState(empty),[saving,setSaving]=useState(false);
 const [message,setMessage]=useState(''),[error,setError]=useState('');
 const [state,setState]=useState<Data|null>(null);
 const choice=KINDS.find(x=>x.value===kind)!;
 useEffect(()=>{
  if(!authorized)return;
  let active=true;
  void Promise.all([fetchAdminCanonicalRelations({kind,page,perPage:20}),
   fetchAdminRelationProposals({kind,page,perPage:20,onlyMine})])
   .then(([canonical,proposals])=>{if(active)setState({kind,page,refresh,onlyMine,canonical,proposals});})
   .catch(()=>{if(active)setState({kind,page,refresh,onlyMine,error:'Relation inventory could not be loaded. Check connection and unapplied migrations.'});});
  return ()=>{active=false;};
 },[authorized,kind,page,refresh,onlyMine]);
 if(status==='loading')return <main role="status" className="mx-auto max-w-6xl px-4 py-12">Checking administrator session…</main>;
 if(status==='error')return <main role="alert" className="mx-auto max-w-6xl px-4 py-12">Cannot verify administrator session.</main>;
 if(!authorized)return <main className="mx-auto max-w-6xl px-4 py-12"><h1 className="text-2xl font-bold">Administrator required</h1><Link href="/login" className="text-primary underline">Sign in</Link></main>;
 const current=state?.kind===kind && state.page===page && state.refresh===refresh && state.onlyMine===onlyMine?state:null;
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(saving)return;setSaving(true);setError('');setMessage('');
  try{await createAdminRelationProposal({kind,...draft});setDraft(empty);
   setMessage('Private quarantined proposal saved. No canonical relationship or public data changed.');setPage(1);setRefresh(n=>n+1);
  }catch(e){setError(e instanceof Error?e.message:'Unable to save relationship proposal.');}
  finally{setSaving(false);}
 }
 return <main className="mx-auto max-w-6xl space-y-6 px-4 py-10 pb-24 sm:px-6">
  <header className="space-y-2"><Link href="/admin/catalog" className="text-sm text-primary underline">← Admin catalog</Link>
   <h1 className="text-3xl font-bold tracking-tight">Relation Manager</h1>
   <p className="max-w-3xl text-sm text-muted-foreground">Read canonical relationships and propose new private links. No automatic approval, canonical write, publication or license inference.</p>
  </header>
  <section className={card}><label className="grid gap-2 text-sm">Relation type
   <select className={control} value={kind} onChange={e=>{setKind(e.target.value as AdminRelationKind);setPage(1);setDraft(empty);setError('');}}>
    {KINDS.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}
   </select></label><p className="mt-3 text-xs text-muted-foreground">{choice.detail}</p></section>
  <section className={card}><h2 className="text-xl font-semibold">Propose a relationship</h2>
   <p className="mt-2 text-sm text-muted-foreground">Use existing canonical UUIDs and traceable human-reviewed references. Proposals are immutable and quarantined; independent editorial approval is separate.</p>
   {kind==='ANIME_EPISODE'?<p role="status" className="mt-4 text-sm">Episode ownership cannot be rewired from this manager.</p>:
   <form className="mt-4 grid gap-3" onSubmit={submit}>
    <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-sm">Source entity UUID<input className={control} required value={draft.sourceId} onChange={e=>setDraft(d=>({...d,sourceId:e.target.value}))}/></label>
     <label className="grid gap-1 text-sm">Target entity UUID<input className={control} required value={draft.targetId} onChange={e=>setDraft(d=>({...d,targetId:e.target.value}))}/></label></div>
    <label className="grid gap-1 text-sm">Relation key<input className={control} required maxLength={180} value={draft.relationKey} onChange={e=>setDraft(d=>({...d,relationKey:e.target.value}))}/></label>
    <label className="grid gap-1 text-sm">Typed details (JSON)<textarea className={control} required maxLength={3000} rows={3} value={draft.detailsJson} onChange={e=>setDraft(d=>({...d,detailsJson:e.target.value}))}/></label>
    <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-sm">Source name<input className={control} required maxLength={150} value={draft.sourceName} onChange={e=>setDraft(d=>({...d,sourceName:e.target.value}))}/></label>
     <label className="grid gap-1 text-sm">Source reference<input className={control} required maxLength={500} value={draft.sourceReference} onChange={e=>setDraft(d=>({...d,sourceReference:e.target.value}))}/></label></div>
    {error?<p role="alert" className="text-sm text-destructive">{error}</p>:null}
    {message?<p role="status" className="text-sm text-muted-foreground">{message}</p>:null}
    <button className={`${control} w-fit bg-primary text-primary-foreground`} disabled={saving} type="submit">{saving?'Saving…':'Save quarantined proposal'}</button>
   </form>}
  </section>
  {!current?<p role="status">Loading canonical and private relations…</p>:null}
  {current?.error?<p role="alert" className="text-destructive">{current.error}</p>:null}
  <div className="grid gap-4 lg:grid-cols-2">
   <section className={card} aria-label="Canonical relation inventory"><h2 className="text-lg font-semibold">Canonical relationships · read only</h2>
    {current?.canonical?.available===false?<p role="status" className="mt-3 text-sm">Canonical table unavailable. No zero count assumed.</p>:null}
    {current?.canonical?.available?<><p className="mt-2 text-sm text-muted-foreground">{current.canonical.total} records</p>
     {current.canonical.items.length===0?<p role="status" className="mt-3 text-sm">No canonical links in this page.</p>:null}
     <ul className="mt-3 space-y-2">{current.canonical.items.map(x=><li key={x.id} className="rounded-lg border border-border p-3 text-xs">
      <p className="font-medium">{x.relationKey} · {x.isPublished===null?'No publication flag':x.isPublished?'Publication flag true':'Not published'}</p>
      <p className="mt-1 break-all">{x.sourceId} → {x.targetId}</p></li>)}</ul>
    </>:null}</section>
   <section className={card} aria-label="Quarantined relationship proposals"><div className="flex flex-wrap justify-between gap-3"><h2 className="text-lg font-semibold">Private proposals</h2>
     <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={onlyMine} onChange={e=>{setOnlyMine(e.target.checked);setPage(1);}}/> Only mine</label></div>
    {current?.proposals?.available===false?<p role="status" className="mt-3 text-sm">Proposal staging table unavailable until migration is approved and applied.</p>:null}
    {current?.proposals?.available?<><p className="mt-2 text-sm text-muted-foreground">{current.proposals.total} quarantined proposals</p>
     {current.proposals.items.length===0?<p role="status" className="mt-3 text-sm">No proposals in this page.</p>:null}
     <ul className="mt-3 space-y-2">{current.proposals.items.map(x=><li key={x.id} className="rounded-lg border border-border p-3 text-xs">
      <p className="font-medium">{x.relationKey} · {x.isQuarantined?'Quarantined':'Review required'}</p>
      <p className="mt-1 break-all">{x.sourceId} → {x.targetId}</p><p className="mt-2 break-all text-muted-foreground">{x.sourceName}: {x.sourceReference}</p></li>)}</ul>
    </>:null}</section>
  </div>
  <nav className="flex justify-end gap-3" aria-label="Relation pagination">
   <button className={control} type="button" disabled={page<=1} onClick={()=>setPage(n=>Math.max(1,n-1))}>Previous</button>
   <button className={control} type="button" disabled={!current?.canonical?.hasNextPage&&!current?.proposals?.hasNextPage} onClick={()=>setPage(n=>n+1)}>Next</button>
   <button className={control} type="button" onClick={()=>setRefresh(n=>n+1)}>Refresh</button>
  </nav>
  <p className="text-xs text-muted-foreground">Private proposals are not canonical links. An isPublished flag is not proof of media, synopsis or licensing rights.</p>
 </main>;
}
