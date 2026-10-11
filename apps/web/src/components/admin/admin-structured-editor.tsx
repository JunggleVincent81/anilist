'use client';

import Link from 'next/link';
import {useEffect,useState,type FormEvent} from 'react';
import {useAuth} from '@/components/auth/auth-provider';
import {createStructuredCandidate,fetchStructuredCandidates,updateStructuredCandidate} from '@/lib/graphql/admin-structured-candidates';
import type {AdminStructuredSubject,StructuredCandidate,StructuredCandidatePage} from '@/lib/graphql/admin-structured-candidates';

type Field = {name:string;label:string;type?:'number'|'date'|'textarea'|'uuid'|'decimal';required?:boolean;max?:number;choices?:string[];min?:number;maxNumber?:number};
const text=(name:string,label:string,max=500,required=false):Field=>({name,label,max,required});
const uuid=(name:string,label:string,required=false):Field=>({name,label,type:'uuid',required,max:36});
const num=(name:string,label:string,min=0,maxNumber=100000):Field=>({name,label,type:'number',min,maxNumber});
const opts=(name:string,label:string,choices:string[]):Field=>({name,label,choices});
const FORM:Record<AdminStructuredSubject,{label:string;fields:Field[]}>= {
  ANIME:{label:'Anime',fields:[text('title','Canonical title proposal',500,true),text('titleRomaji','Romaji title'),text('titleEnglish','English title'),text('titleNative','Native title'),{name:'synopsis',label:'Proposed synopsis',type:'textarea',max:10000},opts('format','Format',['TV','MOVIE','OVA','ONA','SPECIAL','MUSIC','UNKNOWN']),num('seasonYear','Season year',1900,2200)]},
  ANIME_EPISODE:{label:'Anime episode',fields:[uuid('animeId','Anime UUID',true),text('episodeKey','Episode key',180,true),text('title','Episode title'),num('number','Episode number'),num('durationMinutes','Duration (minutes)'),text('sourceReference','Episode-specific source',500)]},
  MANGA_WORK:{label:'Manga work',fields:[text('title','Work title',500,true),text('slug','Proposed slug',220),{name:'synopsis',label:'Synopsis',type:'textarea',max:10000}]},
  MANGA_VOLUME:{label:'Manga volume',fields:[uuid('mangaWorkId','Manga work UUID',true),text('volumeKey','Volume key',180,true),text('title','Volume title'),num('number','Volume number'),{name:'releaseDate',label:'Release date',type:'date'}]},
  MANGA_CHAPTER:{label:'Manga chapter',fields:[uuid('mangaWorkId','Manga work UUID',true),text('chapterKey','Chapter key',180,true),text('title','Chapter title'),{name:'chapterNumber',label:'Chapter number, e.g. 1.5',type:'decimal',max:13},uuid('volumeId','Volume UUID (optional)'),{name:'releaseDate',label:'Release date',type:'date'}]},
  MUSIC_TRACK:{label:'Music track',fields:[text('title','Track title',500,true),text('artistName','Artist display name',250,true),opts('category','Anime music category',['OPENING','ENDING','SOUNDTRACK','INSERT_SONG','OTHER']),uuid('animeId','Associated Anime UUID (optional)')]},
  MUSIC_ARTIST:{label:'Music artist',fields:[text('displayName','Artist display name',250,true),text('artistKey','Artist key',220,true)]},
  MUSIC_RECORDING:{label:'Music recording',fields:[text('title','Recording title',500,true),text('recordingKey','Recording key',220,true),text('versionLabel','Version label',250),num('durationMs','Duration (milliseconds)',0,86400000)]},
  MUSIC_RELEASE:{label:'Music release',fields:[text('title','Release title',500,true),text('releaseKey','Release key',220,true),opts('releaseType','Release type',['SINGLE','EP','ALBUM','SOUNDTRACK','OTHER']),{name:'releaseDate',label:'Release date',type:'date'}]},
};
const control='min-h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50';
const panel='rounded-2xl border border-border bg-surface p-4 sm:p-6';

export function AdminStructuredEditor(){
  const {user,status}=useAuth();
  const authorized=status==='authenticated'&&user?.role==='ADMIN';
  const [kind,setKind]=useState<AdminStructuredSubject>('MANGA_WORK');
  const [sourceName,setSourceName]=useState('');
  const [sourceReference,setSourceReference]=useState('');
  const [values,setValues]=useState<Record<string,string>>({});
  const [editing,setEditing]=useState<StructuredCandidate|null>(null);
  const [page,setPage]=useState(1);
  const [onlyMine,setOnlyMine]=useState(true);
  const [searchInput,setSearchInput]=useState('');
  const [search,setSearch]=useState('');
  const [refresh,setRefresh]=useState(0);
  const [snapshot,setSnapshot]=useState<{key:string;data?:StructuredCandidatePage;error?:string}|null>(null);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const key=JSON.stringify({kind,page,search,onlyMine,refresh});

  useEffect(()=>{
    if(!authorized)return;
    let live=true;
    void fetchStructuredCandidates({subjectType:kind,page,perPage:20,onlyMine,...(search?{search}:{})})
      .then(data=>{if(live)setSnapshot({key,data});})
      .catch(()=>{if(live)setSnapshot({key,error:'Private staging is unavailable. Confirm database migrations and ADMIN privileges.'});});
    return ()=>{live=false;};
  },[authorized,key,kind,page,search,onlyMine]);
  function reset(){setEditing(null);setSourceName('');setSourceReference('');setValues({});setError('');}
  function switchKind(next:AdminStructuredSubject){setKind(next);setPage(1);reset();setMessage('');}
  function begin(item:StructuredCandidate){
    if(!item.editable||!item.fieldsJson)return;
    try{
      const parsed=JSON.parse(item.fieldsJson) as Record<string,string|number>;
      setValues(Object.fromEntries(Object.entries(parsed).map(([k,v])=>[k,String(v)])));
      setSourceName(item.sourceName);setSourceReference(item.sourceReference);
      setEditing(item);setError('');setMessage('');
    }catch{setError('Candidate has incompatible fields and cannot be edited.');}
  }
  async function save(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(busy)return;
    setBusy(true);setError('');setMessage('');
    try{
      const payload:Record<string,string|number>={};
      for(const field of FORM[kind].fields){
        const raw=(values[field.name]??'').trim();
        if(!raw)continue;
        if(field.type==='number'){
          const n=Number(raw);if(!Number.isSafeInteger(n))throw new Error(`${field.label} must be a whole number.`);
          payload[field.name]=n;
        }else payload[field.name]=raw;
      }
      const input={subjectType:kind,sourceName:sourceName.trim(),sourceReference:sourceReference.trim(),fieldsJson:JSON.stringify(payload)};
      if(editing)await updateStructuredCandidate({...input,candidateId:editing.id,expectedUpdatedAt:editing.updatedAt});
      else await createStructuredCandidate(input);
      reset();setPage(1);setRefresh(n=>n+1);
      setMessage('Private quarantined draft saved. No canonical data or publication state changed.');
    }catch(e){setError(e instanceof Error?e.message:'Could not save candidate.');}
    finally{setBusy(false);}
  }
  if(status==='loading')return <main role="status" className="mx-auto max-w-6xl px-4 py-12">Checking admin session…</main>;
  if(status==='error')return <main role="alert" className="mx-auto max-w-6xl px-4 py-12">Could not verify your session.</main>;
  if(!authorized)return <main className="mx-auto max-w-6xl px-4 py-12" role="alert">ADMIN permission required. <Link href="/login" className="text-primary underline">Sign in</Link></main>;
  const current=snapshot?.key===key?snapshot:null;
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-10 pb-24 sm:px-6">
    <header className="space-y-2"><Link className="text-primary underline text-sm" href="/admin/catalog">← Admin Catalog</Link>
      <h1 className="text-3xl font-bold tracking-tight">Quick Add & Full Editors</h1>
      <p className="max-w-3xl text-sm text-muted-foreground">Nine structured subject types; drafts enter private quarantine, not canonical records. Source reference is attribution, not verification of rights.</p>
      <nav className="flex flex-wrap gap-4 text-sm"><Link href="/admin/catalog/anime" className="text-primary underline">Anime Manager</Link><Link href="/admin/catalog/manga" className="text-primary underline">Manga Manager</Link><Link href="/admin/catalog/music" className="text-primary underline">Music Manager</Link></nav>
    </header>
    <section className={panel} aria-label="Structured manual candidate editor">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">{editing?'Edit my private draft':'New quarantined candidate'}</h2><span className="rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground">Draft-only</span></div>
      <form onSubmit={save} className="mt-5 space-y-4">
        <label className="grid gap-1.5 text-sm">Record type
          <select className={control} value={kind} disabled={busy||!!editing} onChange={e=>switchKind(e.target.value as AdminStructuredSubject)}>
            {Object.entries(FORM).map(([id,s])=><option key={id} value={id}>{s.label}</option>)}
          </select>
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1.5 text-sm">Source name<input className={control} value={sourceName} required maxLength={150} disabled={busy} onChange={e=>setSourceName(e.target.value)}/></label>
          <label className="grid gap-1.5 text-sm">Source reference<input className={control} value={sourceReference} required maxLength={500} disabled={busy} onChange={e=>setSourceReference(e.target.value)} placeholder="https://… or an internal citation"/></label>
        </div>
        <fieldset className="grid gap-4 rounded-xl border border-border p-4 md:grid-cols-2" disabled={busy}>
          <legend className="px-2 text-sm font-semibold">{FORM[kind].label} fields</legend>
          {FORM[kind].fields.map(field=><label key={`${kind}-${field.name}`} className={`grid gap-1.5 text-sm ${field.type==='textarea'?'md:col-span-2':''}`}>
            {field.label}{field.required?' *':''}
            {field.choices?<select className={control} required={field.required} value={values[field.name]??''} onChange={e=>setValues(v=>({...v,[field.name]:e.target.value}))}>
              <option value="">Select (optional)</option>{field.choices.map(o=><option key={o} value={o}>{o}</option>)}
            </select>:field.type==='textarea'?<textarea className={control} rows={5} maxLength={field.max} required={field.required} value={values[field.name]??''} onChange={e=>setValues(v=>({...v,[field.name]:e.target.value}))}/>:
              <input className={control} type={field.type==='number'?'number':field.type==='date'?'date':'text'} required={field.required} maxLength={field.max} min={field.min} max={field.maxNumber} step={field.type==='number'?1:undefined} value={values[field.name]??''} onChange={e=>setValues(v=>({...v,[field.name]:e.target.value}))}/>}
          </label>)}
        </fieldset>
        {editing?<p className="text-xs text-muted-foreground">Editing candidate {editing.id}; stale versions and reviewed drafts cannot be overwritten.</p>:null}
        {error?<p role="alert" className="text-sm text-destructive">{error}</p>:null}
        {message?<p role="status" className="text-sm text-muted-foreground">{message}</p>:null}
        <div className="flex flex-wrap gap-3"><button type="submit" disabled={busy} className={`${control} w-auto bg-primary text-primary-foreground`}>{busy?'Saving…':editing?'Save private revision':'Quick Add: save draft'}</button>
          {editing?<button type="button" disabled={busy} className={`${control} w-auto`} onClick={reset}>Cancel edit</button>:null}</div>
      </form>
    </section>
    <section className={panel} aria-label="Private structured candidate history">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Staging & edits · {FORM[kind].label}</h2><button type="button" className={`${control} w-auto`} onClick={()=>setRefresh(n=>n+1)}>Refresh</button></div>
      <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={e=>{e.preventDefault();setSearch(searchInput.trim().slice(0,120));setPage(1);}}>
        <label className="flex min-w-44 flex-1 flex-col gap-1 text-sm">Find by source<input className={control} value={searchInput} maxLength={120} onChange={e=>setSearchInput(e.target.value)}/></label>
        <button type="submit" className={`${control} w-auto`}>Search</button>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyMine} onChange={e=>{setOnlyMine(e.target.checked);setPage(1);}}/> Only mine</label>
      </form>
      {!current?<p role="status" className="py-5 text-sm text-muted-foreground">Loading private candidates…</p>:null}
      {current?.error?<p role="alert" className="py-5 text-sm text-destructive">{current.error}</p>:null}
      {current?.data?<><p className="mt-3 text-xs text-muted-foreground">{current.data.total} candidates · page {current.data.page}</p>
        {current.data.items.length===0?<p role="status" className="py-5 text-sm text-muted-foreground">No candidates. This does not mean your canonical catalog is empty.</p>:null}
        <ul className="mt-3 space-y-2">{current.data.items.map(item=><li key={item.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border p-3">
          <div className="min-w-0 flex-1"><p className="font-medium">{item.sourceName}</p><p className="break-all text-xs text-muted-foreground">{item.sourceReference}</p>
            <p className="mt-2 break-words text-sm text-muted-foreground">{item.fieldsJson??'[Unavailable or unsupported candidate]'} </p>
            <p className="mt-1 text-xs text-muted-foreground">{item.isQuarantined?'Quarantined':'Not quarantined'} · {item.editable?'Editable by you':'Locked, imported or foreign'}</p>
          </div>{item.editable&&item.fieldsJson?<button type="button" className={`${control} w-auto`} onClick={()=>begin(item)}>Edit</button>:null}
        </li>)}</ul>
        <nav aria-label="Candidate pagination" className="mt-4 flex justify-end gap-3"><button className={`${control} w-auto`} type="button" disabled={page<=1} onClick={()=>setPage(n=>Math.max(1,n-1))}>Previous</button>
          <button className={`${control} w-auto`} type="button" disabled={!current.data.hasNextPage} onClick={()=>setPage(n=>n+1)}>Next</button></nav>
      </>:null}
    </section>
    <p className="text-xs text-muted-foreground">No age classification, rights verification, publication, unquarantine, link creation or canonical mutation is performed by this editor.</p>
  </main>;
}
