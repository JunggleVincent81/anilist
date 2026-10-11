'use client';
import Link from 'next/link';
import {useEffect,useState,type FormEvent} from 'react';
import {useAuth} from '@/components/auth/auth-provider';
import {createMediaIntake,createSourceDossier,fetchMediaIntakes,fetchSourceDossiers,revokeSourceDossier} from '@/lib/graphql/admin-media-evidence';
import type {Dossier,MediaIntake,Page,MediaInput,SourceInput} from '@/lib/graphql/admin-media-evidence';
const card='rounded-2xl border border-border bg-surface p-4 sm:p-6';
const control='min-h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50';
const emptySource:SourceInput={sourceUrl:'',publisher:'',rightsBasis:'',licenseLabel:'',attribution:'',expiresAt:''};
const emptyMedia:MediaInput={animeId:'',sourceDossierId:'',kind:'COVER',sha256:'',mime:'image/png',byteLength:0,width:0,height:0,copyrightOwner:''};
function Status({data,title}:{data:Page<unknown>|undefined;title:string}) {
  if(!data)return <p role="status" className="mt-3 text-sm text-muted-foreground">Loading {title}…</p>;
  if(data.available===false)return <p role="status" className="mt-3 rounded-lg border border-dashed border-border p-3 text-sm">{title} unavailable — database migration may still be pending. No zero count assumed.</p>;
  if(data.items.length===0)return <p role="status" className="mt-3 text-sm text-muted-foreground">No {title} records in this page.</p>;
  return null;
}
export function AdminMediaEvidence(){
  const {user,status}=useAuth();
  const authorized=status==='authenticated'&&user?.role==='ADMIN';
  const [source,setSource]=useState<SourceInput>(emptySource);
  const [media,setMedia]=useState<MediaInput>(emptyMedia);
  const [sources,setSources]=useState<{key:string;data?:Page<Dossier>;error?:string}|null>(null);
  const [medias,setMedias]=useState<{key:string;data?:Page<MediaIntake>;error?:string}|null>(null);
  const [page,setPage]=useState(1);
  const [onlyMine,setOnlyMine]=useState(true);
  const [refresh,setRefresh]=useState(0);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [revokeConfirmed,setRevokeConfirmed]=useState(false);
  const key=JSON.stringify({page,onlyMine,refresh});
  useEffect(()=>{
    if(!authorized)return;
    let active=true;
    const filter={page,perPage:20,onlyMine};
    void fetchSourceDossiers(filter).then(data=>{if(active)setSources({key,data});})
      .catch(()=>{if(active)setSources({key,error:'Source dossiers could not be loaded.'});});
    void fetchMediaIntakes(filter).then(data=>{if(active)setMedias({key,data});})
      .catch(()=>{if(active)setMedias({key,error:'Media metadata could not be loaded.'});});
    return()=>{active=false;};
  },[authorized,key,page,onlyMine]);
  if(status==='loading')return <main role="status" className="mx-auto max-w-6xl p-8">Checking administrator session…</main>;
  if(status==='error')return <main role="alert" className="mx-auto max-w-6xl p-8">Administrator session could not be verified.</main>;
  if(!authorized)return <main className="mx-auto max-w-6xl space-y-3 p-8"><h1 className="text-2xl font-bold">ADMIN required</h1><Link className="underline text-primary" href="/login">Sign in</Link></main>;
  const currentSources=sources?.key===key?sources:null;
  const currentMedias=medias?.key===key?medias:null;
  function notify(){setPage(1);setRefresh(n=>n+1);}
  async function saveSource(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(busy)return;setBusy(true);setError('');setMessage('');
    try{await createSourceDossier({sourceUrl:source.sourceUrl.trim(),publisher:source.publisher.trim(),rightsBasis:source.rightsBasis.trim(),
      ...(source.licenseLabel?.trim()?{licenseLabel:source.licenseLabel.trim()}:{}),
      ...(source.attribution?.trim()?{attribution:source.attribution.trim()}:{}),
      ...(source.expiresAt?.trim()?{expiresAt:new Date(source.expiresAt).toISOString()}:{}),});
      setSource(emptySource);setMessage('Source rights claim saved as quarantined and UNVERIFIED.');notify();
    }catch(e){setError(e instanceof Error?e.message:'Unable to save evidence claim.');}finally{setBusy(false);}
  }
  async function saveMedia(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(busy)return;setBusy(true);setError('');setMessage('');
    try{await createMediaIntake({...media,animeId:media.animeId.trim(),sourceDossierId:media.sourceDossierId.trim(),sha256:media.sha256.trim(),copyrightOwner:media.copyrightOwner.trim()});
      setMedia(emptyMedia);setMessage('Private image metadata recorded. No media bytes were uploaded or published.');notify();
    }catch(e){setError(e instanceof Error?e.message:'Unable to save media metadata.');}finally{setBusy(false);}
  }
  async function revoke(id:string){if(busy||!revokeConfirmed)return;setBusy(true);setError('');setMessage('');
    try{await revokeSourceDossier(id);setRevokeConfirmed(false);setMessage('Source claim permanently revoked. Associated media remains quarantined.');notify();}
    catch(e){setError(e instanceof Error?e.message:'Unable to revoke claim.');}finally{setBusy(false);}
  }
  const label=(title:string,name:keyof SourceInput)=> <label className="grid gap-1 text-sm" key={name}>{title}
    <input className={control} value={source[name]??''} maxLength={name==='sourceUrl'?2048:name==='rightsBasis'||name==='attribution'?500:name==='publisher'?191:100}
      onChange={e=>setSource(s=>({...s,[name]:e.target.value}))}/></label>;
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-10 pb-24 sm:px-6">
    <header className="space-y-2"><Link className="text-primary underline text-sm" href="/admin/catalog">← Admin catalog</Link>
      <h1 className="text-3xl font-bold">Media, Sources &amp; Evidence</h1>
      <p className="text-sm text-muted-foreground">A rights claim, URL or image digest is NOT independent license verification. All records stay private and quarantined. No asset upload, display rights, approval or publication.</p>
    </header>
    {error?<p role="alert" className="rounded-lg border border-destructive p-3 text-sm text-destructive">{error}</p>:null}
    {message?<p role="status" className="rounded-lg border border-border p-3 text-sm">{message}</p>:null}
    <div className="grid gap-4 lg:grid-cols-2">
      <section className={card}><h2 className="text-xl font-semibold">1. Record source &amp; rights claim</h2>
        <p className="mt-2 text-xs text-muted-foreground">Provide verifiable reference and your assessment. This does not grant reuse rights.</p>
        <form className="mt-4 grid gap-3" onSubmit={saveSource}>
          {label('HTTPS source URL','sourceUrl')}{label('Publisher / rights claimant','publisher')}
          <label className="grid gap-1 text-sm">Rights basis (20–500 chars)<textarea className={control} required minLength={20} maxLength={500} rows={3}
            value={source.rightsBasis} onChange={e=>setSource(s=>({...s,rightsBasis:e.target.value}))}/></label>
          {label('License label (unverified, optional)','licenseLabel')}{label('Attribution (optional)','attribution')}
          <label className="grid gap-1 text-sm">Expiry (optional, local time)<input type="datetime-local" className={control} value={source.expiresAt??''} onChange={e=>setSource(s=>({...s,expiresAt:e.target.value}))}/></label>
          <button className={`${control} bg-primary text-primary-foreground`} disabled={busy} type="submit">{busy?'Saving…':'Save private source claim'}</button>
        </form>
      </section>
      <section className={card}><h2 className="text-xl font-semibold">2. Stage image metadata</h2>
        <p className="mt-2 text-xs text-muted-foreground">Metadata only: no file upload, external download, CDN key, or public image release.</p>
        <form className="mt-4 grid gap-3" onSubmit={saveMedia}>
          <label className="grid gap-1 text-sm">Anime UUID<input className={control} required value={media.animeId} onChange={e=>setMedia(m=>({...m,animeId:e.target.value}))}/></label>
          <label className="grid gap-1 text-sm">Owned source dossier UUID<input className={control} required value={media.sourceDossierId} onChange={e=>setMedia(m=>({...m,sourceDossierId:e.target.value}))}/></label>
          <label className="grid gap-1 text-sm">Image kind<select className={control} value={media.kind} onChange={e=>setMedia(m=>({...m,kind:e.target.value as MediaInput['kind']}))}><option value="COVER">Cover</option><option value="BANNER">Banner</option></select></label>
          <label className="grid gap-1 text-sm">SHA-256 digest<input className={control} required maxLength={64} value={media.sha256} onChange={e=>setMedia(m=>({...m,sha256:e.target.value}))}/></label>
          <label className="grid gap-1 text-sm">MIME<select className={control} value={media.mime} onChange={e=>setMedia(m=>({...m,mime:e.target.value}))}>{['image/png','image/jpeg','image/webp','image/avif'].map(v=><option key={v}>{v}</option>)}</select></label>
          <div className="grid grid-cols-3 gap-2">{(['byteLength','width','height'] as const).map(v=><label key={v} className="grid gap-1 text-xs">{v}<input className={control} type="number" min={1} required value={media[v]||''} onChange={e=>setMedia(m=>({...m,[v]:Number(e.target.value)}))}/></label>)}</div>
          <label className="grid gap-1 text-sm">Copyright owner<input className={control} required maxLength={255} value={media.copyrightOwner} onChange={e=>setMedia(m=>({...m,copyrightOwner:e.target.value}))}/></label>
          <button className={`${control} bg-primary text-primary-foreground`} type="submit" disabled={busy}>{busy?'Saving…':'Save quarantined metadata'}</button>
        </form>
      </section>
    </div>
    <section className={card} aria-label="Evidence inventory"><div className="flex flex-wrap items-center justify-between gap-4"><h2 className="text-xl font-semibold">Private evidence inventory</h2>
      <div className="flex items-center gap-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyMine} onChange={e=>{setOnlyMine(e.target.checked);setPage(1);}}/> Only mine</label>
        <button className={control} type="button" onClick={()=>setRefresh(n=>n+1)}>Refresh</button></div></div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div><h3 className="font-semibold">Source dossiers</h3><Status data={currentSources?.data} title="source dossiers"/>
          {currentSources?.error?<p role="alert">{currentSources.error}</p>:null}
          <label className="mt-3 flex items-center gap-2 text-xs"><input type="checkbox" checked={revokeConfirmed} onChange={e=>setRevokeConfirmed(e.target.checked)}/> I confirm that revocation is permanent.</label>
          <ul className="mt-3 space-y-2">{currentSources?.data?.items.map(x=><li key={x.id} className="rounded-lg border border-border p-3 text-xs">
            <p className="break-all font-semibold">{x.id}</p><p className="mt-1 break-all">{x.publisher}: {x.sourceUrl}</p>
            <p className="mt-1 whitespace-pre-wrap">{x.rightsBasis}</p>
            <p className="mt-1 text-muted-foreground">Quarantined · rights UNVERIFIED · {x.revokedAt?'REVOKED':x.expiresAt&&new Date(x.expiresAt)<=new Date()?'EXPIRED':'Active claim (not verified)'}</p>
            {!x.revokedAt&&onlyMine?<button type="button" className="mt-2 text-destructive underline disabled:opacity-40" disabled={!revokeConfirmed||busy} onClick={()=>void revoke(x.id)}>Revoke source claim</button>:null}
          </li>)}</ul></div>
        <div><h3 className="font-semibold">Image metadata staging</h3><Status data={currentMedias?.data} title="image metadata"/>
          {currentMedias?.error?<p role="alert">{currentMedias.error}</p>:null}
          <ul className="mt-3 space-y-2">{currentMedias?.data?.items.map(x=><li key={x.id} className="rounded-lg border border-border p-3 text-xs">
            <p>{x.kind} · {x.width} × {x.height} · {x.mime}</p><p className="mt-1 break-all">Anime: {x.animeId}</p>
            <p className="mt-1 break-all">SHA-256: {x.sha256}</p><p className="mt-1 break-all">Source: {x.sourceDossierId}</p>
            <p className="mt-1 text-muted-foreground">Quarantined · no media bytes stored · no license clearance</p>
          </li>)}</ul></div>
      </div>
      <nav className="mt-5 flex justify-end gap-3" aria-label="Media evidence pages"><button type="button" className={control} disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Previous</button>
        <button type="button" className={control} disabled={!(currentSources?.data?.hasNextPage||currentMedias?.data?.hasNextPage)} onClick={()=>setPage(p=>p+1)}>Next</button></nav>
    </section>
  </main>;
}
