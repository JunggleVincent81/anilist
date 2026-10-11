'use client';
import Link from 'next/link';
import {useEffect,useState,type FormEvent} from 'react';
import {useAuth} from '@/components/auth/auth-provider';
import {createEditorialCase,fetchEditorialCaseDetail,fetchEditorialCases,transitionEditorialCase} from '@/lib/graphql/admin-editorial-review';
import type {EditorialCase,EditorialDetail,EditorialPage,EditorialTransition} from '@/lib/graphql/admin-editorial-review';
const card='rounded-2xl border border-border bg-surface p-4 sm:p-6';
const control='min-h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-primary';
const actions:{value:EditorialTransition;label:string}[]=[
  {value:'SUBMIT',label:'Submit my draft'}, {value:'BEGIN_REVIEW',label:'Begin independent review'},
  {value:'REQUEST_CHANGES',label:'Request changes'}, {value:'REJECT',label:'Reject with reason'},
];
export function AdminEditorialReview(){
  const {user,status}=useAuth();
  const authorized=status==='authenticated'&&user?.role==='ADMIN';
  const [candidateId,setCandidateId]=useState('');
  const [canonicalEntityId,setCanonicalEntityId]=useState('');
  const [page,setPage]=useState(1);
  const [onlyMine,setOnlyMine]=useState(false);
  const [stateFilter,setStateFilter]=useState('ALL');
  const [refresh,setRefresh]=useState(0);
  const [cases,setCases]=useState<{key:string;data?:EditorialPage;error?:string}|null>(null);
  const [chosen,setChosen]=useState<string|null>(null);
  const [detail,setDetail]=useState<{key:string;data?:EditorialDetail;error?:string}|null>(null);
  const [action,setAction]=useState<EditorialTransition>('SUBMIT');
  const [note,setNote]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const key=JSON.stringify({page,onlyMine,stateFilter,refresh});
  const detailKey=JSON.stringify({chosen,refresh});
  useEffect(()=>{
    if(!authorized)return;
    let active=true;
    void fetchEditorialCases({page,perPage:20,onlyMine,...(stateFilter==='ALL'?{}:{state:stateFilter})})
      .then(data=>{if(active)setCases({key,data});})
      .catch(()=>{if(active)setCases({key,error:'Private editorial queue unavailable. Check database migrations.'});});
    return()=>{active=false;};
  },[authorized,key,page,onlyMine,stateFilter]);
  useEffect(()=>{
    if(!authorized||!chosen)return;
    let active=true;
    void fetchEditorialCaseDetail(chosen).then(data=>{if(active)setDetail({key:detailKey,data});})
      .catch(()=>{if(active)setDetail({key:detailKey,error:'Cannot load case or audit history.'});});
    return()=>{active=false;};
  },[authorized,chosen,detailKey]);
  if(status==='loading')return <main role="status" className="mx-auto max-w-6xl p-8">Checking administrator session…</main>;
  if(status==='error')return <main role="alert" className="mx-auto max-w-6xl p-8">Unable to verify administrator session.</main>;
  if(!authorized)return <main className="mx-auto max-w-6xl p-8"><h1 className="text-2xl font-bold">ADMIN required</h1><Link href="/login" className="text-primary underline">Sign in</Link></main>;
  const current=cases?.key===key?cases:null;
  const selected=detail?.key===detailKey?detail:null;
  function updated(){setPage(1);setRefresh(n=>n+1);}
  async function create(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(busy)return;setBusy(true);setError('');setMessage('');
    try{const c=await createEditorialCase({candidateId:candidateId.trim(),...(canonicalEntityId.trim()?{canonicalEntityId:canonicalEntityId.trim()}:{})});
      setCandidateId('');setCanonicalEntityId('');setChosen(c.id);setMessage('Private case opened at DRAFT. No approval or canonical write occurred.');updated();}
    catch(e){setError(e instanceof Error?e.message:'Unable to open case.');}finally{setBusy(false);}
  }
  async function move(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(busy||!selected?.data)return;setBusy(true);setError('');setMessage('');
    try{await transitionEditorialCase({caseId:selected.data.id,expectedRevision:selected.data.revision,action,
      ...(action==='REJECT'||action==='REQUEST_CHANGES'?{note:note.trim()}:{})});
      setNote('');setMessage('Review state updated with an immutable audit transition. Canonical data unchanged.');updated();}
    catch(e){setError(e instanceof Error?e.message:'Editorial transition denied.');}finally{setBusy(false);}
  }
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-10 pb-24 sm:px-6">
    <header className="space-y-2"><Link className="text-sm text-primary underline" href="/admin/catalog">← Admin catalog</Link>
      <h1 className="text-3xl font-bold">Editorial Review &amp; Audit</h1>
      <p className="max-w-3xl text-sm text-muted-foreground">Private draft case triage only. No approval, candidate unquarantine, canonical commit, media rights certification, or publication is available in this workspace.</p>
    </header>
    {error?<p role="alert" className="rounded-lg border border-destructive p-3 text-sm text-destructive">{error}</p>:null}
    {message?<p role="status" className="rounded-lg border border-border p-3 text-sm">{message}</p>:null}
    <section className={card}><h2 className="text-xl font-semibold">Open a candidate for review</h2>
      <p className="mt-2 text-xs text-muted-foreground">Use the UUID of an unlinked quarantined manual candidate you created in <Link href="/admin/catalog/editor" className="text-primary underline">Quick Add</Link>. Existing-entity comparisons are available for Anime, Manga Works, and Music Tracks; all others must be new-entry cases.</p>
      <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={create}>
        <label className="grid min-w-48 flex-1 gap-1 text-sm">Candidate UUID<input className={control} required maxLength={36} value={candidateId} onChange={e=>setCandidateId(e.target.value)}/></label>
        <label className="grid min-w-48 flex-1 gap-1 text-sm">Canonical UUID (optional)<input className={control} maxLength={36} value={canonicalEntityId} onChange={e=>setCanonicalEntityId(e.target.value)}/></label>
        <button className={control} disabled={busy} type="submit">Open private case</button>
      </form>
    </section>
    <section className={card}><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Review queue</h2><button className={control} type="button" onClick={()=>setRefresh(n=>n+1)}>Refresh</button></div>
      <div className="mt-4 flex flex-wrap gap-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyMine} onChange={e=>{setOnlyMine(e.target.checked);setPage(1);}}/> Cases opened by me</label>
        <label className="flex items-center gap-2 text-sm">State<select className={control} value={stateFilter} onChange={e=>{setStateFilter(e.target.value);setPage(1);}}>{['ALL','DRAFT','SUBMITTED','UNDER_REVIEW','APPROVED','REJECTED','REVOKED'].map(v=><option key={v}>{v}</option>)}</select></label></div>
      {!current?<p role="status" className="mt-4 text-sm">Loading case queue…</p>:null}
      {current?.error?<p role="alert" className="mt-4 text-sm text-destructive">{current.error}</p>:null}
      {current?.data?.available===false?<p role="status" className="mt-4 text-sm">Editorial tables unavailable. Migration rollout still required; zero count is not assumed.</p>:null}
      {current?.data?.available?<><p className="mt-4 text-xs text-muted-foreground">{current.data.total} cases</p>
        {current.data.items.length===0?<p className="mt-3 text-sm">No cases match this filter.</p>:null}
        <ul className="mt-3 grid gap-2">{current.data.items.map((c:EditorialCase)=><li key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm"><div>
          <p className="font-medium">{c.candidateLabel} · {c.subjectType}</p>
          <p className="text-xs text-muted-foreground">{c.state} · revision {c.revision} · {c.sourceName}</p></div>
          <button type="button" className={control} onClick={()=>{setChosen(c.id);setError('');}}>Inspect case</button></li>)}</ul>
        <nav className="mt-4 flex justify-end gap-3" aria-label="Editorial queue pages"><button className={control} disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Previous</button><button className={control} disabled={!current.data.hasNextPage} onClick={()=>setPage(p=>p+1)}>Next</button></nav>
      </>:null}
    </section>
    {chosen?<section className={card} aria-label="Editorial case details"><h2 className="text-xl font-semibold">Review case &amp; audit trail</h2>
      {!selected?<p role="status" className="mt-4 text-sm">Loading case evidence…</p>:null}
      {selected?.error?<p role="alert" className="mt-4 text-destructive">{selected.error}</p>:null}
      {selected?.data?<><p className="mt-3 text-sm">{selected.data.subjectType} · {selected.data.state} · revision {selected.data.revision} · {selected.data.comparisonStatus}</p>
        <p className="mt-1 break-all text-xs text-muted-foreground">Case {selected.data.id} · Candidate {selected.data.candidateId} · {selected.data.sourceReference}</p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2"><div><h3 className="font-semibold">Current canonical snapshot</h3><pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-border p-3 text-xs">{selected.data.canonicalBeforeJson ?? 'No applicable canonical snapshot. This is not proof of equality.'}</pre></div>
          <div><h3 className="font-semibold">Proposed draft fields</h3><pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-border p-3 text-xs">{selected.data.proposedJson ?? 'Candidate fields unavailable.'}</pre></div></div>
        <p className="mt-4 font-semibold">Commit readiness: BLOCKED</p><ul className="mt-2 list-inside list-disc space-y-1 text-xs text-muted-foreground">{selected.data.blockers.map(v=><li key={v}>{v}</li>)}</ul>
        <form className="mt-5 grid gap-3 border-t border-border pt-4" onSubmit={move}><h3 className="font-semibold">Guarded review transition</h3>
          <label className="grid gap-1 text-sm">Action<select className={control} value={action} onChange={e=>setAction(e.target.value as EditorialTransition)}>{actions.map(a=><option key={a.value} value={a.value}>{a.label}</option>)}</select></label>
          {(action==='REJECT'||action==='REQUEST_CHANGES')?<label className="grid gap-1 text-sm">Required human reason (5–2000 characters)<textarea className={control} required minLength={5} maxLength={2000} rows={3} value={note} onChange={e=>setNote(e.target.value)}/></label>:null}
          <button className={control} type="submit" disabled={busy}>Record guarded transition</button>
          <p className="text-xs text-muted-foreground">The server checks a persisted ADMIN role, ownership, independent reviewer, current state, and revision. A request to approve or publish is never available.</p>
        </form><h3 className="mt-6 font-semibold">Append-only transition history</h3>
        {selected.data.history.length===0?<p className="mt-2 text-sm">No transitions recorded; case is still at initial revision.</p>:null}
        <ol className="mt-3 space-y-2">{selected.data.history.map(h=><li key={h.id} className="rounded-lg border border-border p-3 text-xs">
          <p className="font-semibold">{h.action} · {h.fromState} → {h.toState} · revision {h.nextRevision}</p>
          <p className="mt-1 break-all text-muted-foreground">Actor {h.actorId} · {new Date(h.createdAt).toLocaleString()}</p>
          {h.note?<p className="mt-1 whitespace-pre-wrap">Reason: {h.note}</p>:null}</li>)}</ol>
      </>:null}</section>:null}
  </main>;
}
