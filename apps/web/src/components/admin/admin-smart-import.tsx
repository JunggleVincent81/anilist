'use client';
import Link from 'next/link';
import {useEffect,useState,type FormEvent} from 'react';
import {useAuth} from '@/components/auth/auth-provider';
import {applyAdminImport,fetchAdminImportHistory,previewAdminImport} from '@/lib/graphql/admin-smart-import';
import type {AdminImportSubject,ImportBatch,ImportPage} from '@/lib/graphql/admin-smart-import';
const kinds: {value:AdminImportSubject;label:string}[]=[
  {value:'ANIME',label:'Anime'},{value:'ANIME_EPISODE',label:'Anime episode'},
  {value:'MANGA_WORK',label:'Manga work'},{value:'MANGA_VOLUME',label:'Manga volume'},
  {value:'MANGA_CHAPTER',label:'Manga chapter'},{value:'MUSIC_TRACK',label:'Music track'},
  {value:'MUSIC_ARTIST',label:'Music artist'},{value:'MUSIC_RECORDING',label:'Music recording'},
  {value:'MUSIC_RELEASE',label:'Music release'}];
const card='rounded-2xl border border-border bg-surface p-4 sm:p-6';
const control='min-h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50';
function getIssues(value:string):{row:number;reason:string}[]{
  try {const rows=JSON.parse(value) as unknown;
    return Array.isArray(rows)?rows.filter((x):x is {row:number;reason:string}=>
      !!x&&typeof x==='object'&&typeof x.row==='number'&&typeof x.reason==='string').slice(0,100):[];
  }catch{return [];}
}
export function AdminSmartImport(){
  const {user,status}=useAuth();
  const authorized=status==='authenticated'&&user?.role==='ADMIN';
  const [kind,setKind]=useState<AdminImportSubject>('MANGA_WORK');
  const [sourceName,setSourceName]=useState('');
  const [sourceReference,setSourceReference]=useState('');
  const [file,setFile]=useState<File|null>(null);
  const [batch,setBatch]=useState<ImportBatch|null>(null);
  const [history,setHistory]=useState<{key:string;data?:ImportPage;error?:string}|null>(null);
  const [page,setPage]=useState(1);
  const [refresh,setRefresh]=useState(0);
  const [busy,setBusy]=useState(false);
  const [confirmApply,setConfirmApply]=useState(false);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const key=JSON.stringify({page,refresh});
  useEffect(()=>{if(!authorized)return;let active=true;
    void fetchAdminImportHistory({page,perPage:20})
      .then(data=>{if(active)setHistory({key,data});})
      .catch(()=>{if(active)setHistory({key,error:'Import history could not be loaded. Database migration may be pending.'});});
    return()=>{active=false;};
  },[authorized,key,page]);
  function invalidate(){setPage(1);setRefresh(x=>x+1);}
  function clearPreview(){setBatch(null);setConfirmApply(false);setMessage('');setError('');}
  async function preview(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(!file||busy)return;clearPreview();setBusy(true);
    try{
      if(file.size<2||file.size>64*1024)throw new Error('File size must be 2–65536 bytes.');
      if(!/\.(csv|xlsx)$/i.test(file.name))throw new Error('Only CSV/XLSX allowed.');
      const bytes=new Uint8Array(await file.arrayBuffer());let raw='';
      for(let i=0;i<bytes.length;i+=8192)raw+=String.fromCharCode(...bytes.subarray(i,i+8192));
      const result=await previewAdminImport({subjectType:kind,fileName:file.name,base64:btoa(raw),
        sourceName:sourceName.trim(),sourceReference:sourceReference.trim()});
      setBatch(result);setMessage('Dry-run recorded. No canonical records or candidate rows were written.');invalidate();
    }catch(e){setError(e instanceof Error?e.message:'Unable to inspect spreadsheet.');}
    finally{setBusy(false);}
  }
  async function commit(){if(!batch||busy||!confirmApply||batch.invalidCount!==0)return;
    setBusy(true);setError('');setMessage('');
    try{const saved=await applyAdminImport({batchId:batch.id,expectedFileSha256:batch.fileSha256});
      setBatch(saved);setConfirmApply(false);setMessage('Candidate rows saved to private quarantine. Publication and approval remain blocked.');invalidate();}
    catch(e){setError(e instanceof Error?e.message:'Unable to stage this batch.');}
    finally{setBusy(false);}
  }
  if(status==='loading')return <main role="status" className="mx-auto max-w-6xl p-8">Checking administrator session…</main>;
  if(status==='error')return <main role="alert" className="mx-auto max-w-6xl p-8">Cannot verify session.</main>;
  if(!authorized)return <main className="mx-auto max-w-6xl space-y-4 p-8"><h1 className="text-2xl font-bold">ADMIN required</h1><Link href="/login" className="underline text-primary">Sign in</Link></main>;
  const loaded=history?.key===key?history:null;
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-10 pb-24 sm:px-6">
    <header className="space-y-2"><Link href="/admin/catalog" className="text-primary underline text-sm">← Admin catalog</Link>
      <h1 className="text-3xl font-bold">Smart Import &amp; History</h1>
      <p className="text-sm text-muted-foreground">ADMIN only · CSV/XLSX values only · 100 rows/64 KiB maximum. File bytes are not retained. Preview does not stage candidates. Apply is explicitly confirmed, audited and quarantined. No publication.</p>
    </header>
    <form className={`${card} grid gap-3`} onSubmit={preview}>
      <h2 className="text-xl font-semibold">1. Upload and inspect privately</h2>
      <label className="grid gap-1 text-sm">Catalog domain<select className={control} value={kind} onChange={e=>{setKind(e.target.value as AdminImportSubject);clearPreview();}}>
        {kinds.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}
      </select></label>
      <label className="grid gap-1 text-sm">CSV / XLSX spreadsheet<input type="file" required accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className={control} onChange={e=>{setFile(e.target.files?.[0]??null);clearPreview();}}/></label>
      <p className="text-xs text-muted-foreground">First row must contain exact field keys supported by Quick Add. XLSX: standard first worksheet, contiguous rows; no formulas, macro files or external links. To preserve values, export plain CSV if your workbook uses formulas.</p>
      <label className="grid gap-1 text-sm">Human source / publisher<input className={control} required maxLength={150} value={sourceName}
        onChange={e=>{setSourceName(e.target.value);clearPreview();}}/></label>
      <label className="grid gap-1 text-sm">Source reference / citation<input className={control} required maxLength={450} value={sourceReference}
        onChange={e=>{setSourceReference(e.target.value);clearPreview();}}/></label>
      <button className={`${control} bg-primary text-primary-foreground`} disabled={busy||!file} type="submit">{busy?'Validating…':'Run private dry-run'}</button>
    </form>
    {error?<p role="alert" className="text-destructive">{error}</p>:null}
    {message?<p role="status" className="text-sm">{message}</p>:null}
    {batch?<section className={card} aria-label="Import preview">
      <h2 className="text-xl font-semibold">2. Review batch and confirm staging</h2>
      <p className="mt-2 break-all text-xs">{batch.fileName} · SHA-256 {batch.fileSha256}</p>
      <p className="mt-2 text-sm">{batch.rowCount} data rows · {batch.validCount} valid · {batch.invalidCount} invalid · status {batch.status}</p>
      {batch.status==='APPLIED'?<p role="status" className="mt-2 text-sm">{batch.createdCount} quarantined candidates created · {batch.skippedCount} duplicate/skipped.</p>:null}
      {getIssues(batch.issuesJson).length?<ul className="mt-3 space-y-1 text-xs" aria-label="Row issues">{getIssues(batch.issuesJson).map(x=><li key={`${x.row}-${x.reason}`} className="rounded border border-border p-2">Row {x.row}: {x.reason}</li>)}</ul>:<p className="mt-2 text-sm">No row errors reported.</p>}
      {batch.status==='PREVIEWED'&&batch.invalidCount===0?<div className="mt-4 space-y-3">
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmApply} onChange={e=>setConfirmApply(e.target.checked)}/>
          I reviewed the staged preview and authorize private quarantine only. I understand this does not verify rights or publish content.</label>
        <button type="button" className={`${control} bg-primary text-primary-foreground`} disabled={!confirmApply||busy} onClick={()=>void commit()}>
          {busy?'Saving…':'Confirm import into quarantine'}</button>
      </div>:null}
      {batch.status==='PREVIEWED'&&batch.invalidCount>0?<p className="mt-3 text-sm text-destructive">Invalid rows block Apply. Correct the file and run a new dry-run.</p>:null}
    </section>:null}
    <section className={card} aria-label="Import history">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Owned import batches</h2>
        <button type="button" className="text-sm text-primary underline" onClick={()=>setRefresh(x=>x+1)}>Refresh history</button></div>
      {!loaded?<p role="status" className="mt-3 text-sm">Loading batch history…</p>:null}
      {loaded?.error?<p role="alert" className="mt-3 text-sm text-destructive">{loaded.error}</p>:null}
      {loaded?.data?.available===false?<p role="status">History staging table not yet available. Database rollout is separate.</p>:null}
      {loaded?.data?.available&&loaded.data.items.length===0?<p role="status">No import batches yet.</p>:null}
      <ul className="mt-4 space-y-3">{loaded?.data?.items.map(x=><li key={x.id} className="rounded-lg border border-border p-3 text-sm">
        <p className="font-medium">{x.fileName} · {x.subjectType} · {x.status}</p>
        <p className="mt-1 text-xs text-muted-foreground">{x.rowCount} rows, {x.createdCount} staged, {x.skippedCount} skipped, {x.invalidCount} invalid</p>
        <p className="mt-1 break-all text-xs">{x.id}</p>
        {x.status==='PREVIEWED'&&x.invalidCount===0?<button className="mt-2 text-xs text-primary underline" type="button" onClick={()=>{setBatch(x);setConfirmApply(false);window.scrollTo({top:0,behavior:'smooth'});}}>Review and confirm</button>:null}
      </li>)}</ul>
      <div className="mt-4 flex justify-end gap-3"><button type="button" className={`${control} w-auto`} disabled={page<=1}
        onClick={()=>setPage(p=>Math.max(1,p-1))}>Previous</button><button type="button" className={`${control} w-auto`} disabled={!loaded?.data?.hasNextPage}
        onClick={()=>setPage(p=>p+1)}>Next</button></div>
    </section>
  </main>;
}
