'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { fetchAdminCatalogOverview, fetchAdminCatalogPage } from '@/lib/graphql/admin-catalog';
import type { AdminCatalogAge, AdminCatalogOverview, AdminCatalogResult, AdminCatalogStatus } from '@/lib/graphql/admin-catalog';

const cardStyle = 'rounded-2xl border border-border bg-surface p-4 sm:p-5';
const controlStyle = 'min-h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-primary';

export function AdminCatalogDashboard() {
  const { user, status: authStatus } = useAuth();
  const [draftSearch, setDraftSearch] = useState('');
  const [search, setSearch] = useState('');
  const [catalogStatus, setCatalogStatus] = useState<AdminCatalogStatus | 'ALL'>('ALL');
  const [age, setAge] = useState<AdminCatalogAge | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [data, setData] = useState<{ key: string; overview: AdminCatalogOverview; result: AdminCatalogResult } | null>(null);
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);
  const key = JSON.stringify({ search, catalogStatus, age, page, refresh });
  const authorized = authStatus === 'authenticated' && user?.role === 'ADMIN';

  useEffect(() => {
    if (!authorized) return;
    let active = true;
    const input = {
      page,
      perPage: 20,
      ...(search ? { search } : {}),
      ...(catalogStatus !== 'ALL' ? { status: catalogStatus } : {}),
      ...(age !== 'ALL' ? { age } : {}),
    };
    void Promise.all([fetchAdminCatalogOverview(), fetchAdminCatalogPage(input)])
      .then(([overview, result]) => {
        if (!active) return;
        setData({ key, overview, result });
        setFailure(null);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setFailure({ key, message: error instanceof Error ? error.message : 'Catalog data is unavailable.' });
      });
    return () => { active = false; };
  }, [authorized, key, page, search, catalogStatus, age]);

  if (authStatus === 'loading') {
    return <main className="mx-auto max-w-6xl px-4 py-12 text-muted-foreground" role="status">Checking your admin session…</main>;
  }
  if (authStatus === 'error') {
    return <main className="mx-auto max-w-6xl px-4 py-12" role="alert">Unable to verify your session. Please reload or try again later.</main>;
  }
  if (authStatus !== 'authenticated') {
    return <main className="mx-auto max-w-6xl space-y-4 px-4 py-12"><h1 className="text-2xl font-bold">Administrator access required</h1><p className="text-muted-foreground">Sign in to access catalog curation.</p><Link href="/login" className="text-primary underline">Sign in</Link></main>;
  }
  if (!authorized) {
    return <main className="mx-auto max-w-6xl px-4 py-12" role="alert"><h1 className="text-2xl font-bold">Access denied</h1><p className="mt-2 text-muted-foreground">This catalog is restricted to administrators. Moderator access does not include catalog curation.</p></main>;
  }

  const loaded = data?.key === key ? data : null;
  const currentFailure = failure?.key === key ? failure.message : null;
  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(draftSearch.trim().slice(0, 120));
  }

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10 pb-24 sm:px-6">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Administration / catalog</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><h1 className="text-3xl font-bold tracking-tight">Catalog curation</h1><p className="mt-2 text-sm text-muted-foreground">Private catalog inspection and separate synopsis drafting. Canonical edits and publishing remain disabled.</p></div>
          <Link href="/admin/catalog/review" className={controlStyle}>Review submissions</Link><button type="button" onClick={() => setRefresh((n) => n + 1)} className={controlStyle}>Refresh data</button>
        </div>
      </header>

      {currentFailure ? <div role="alert" className={`${cardStyle} border-destructive/50`}><p>Unable to load admin catalog: {currentFailure}</p><button className="mt-3 text-sm text-primary underline" onClick={() => setRefresh((n) => n + 1)} type="button">Try again</button></div> : null}
      {!loaded && !currentFailure ? <p role="status" className="text-sm text-muted-foreground">Loading private catalog metrics…</p> : null}
      {loaded ? <>
        <section aria-label="Catalog overview" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {([
            ['All anime', loaded.overview.total],
            ['Included', loaded.overview.included],
            ['Needs review', loaded.overview.review],
            ['Excluded', loaded.overview.excluded],
            ['Age unknown', loaded.overview.unverifiedAge],
            ['Synopsis missing', loaded.overview.emptySynopsis],
            ['Cover absent', loaded.overview.missingCover],
            ['Curation requests', loaded.overview.curationRequests],
          ] as [string, number][]).map(([label, count]) => <div key={label} className={cardStyle}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{count.toLocaleString()}</p></div>)}
        </section>
      </> : null}

      <section className={cardStyle} aria-label="Admin catalog filters">
        <form onSubmit={submitSearch} className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-52 flex-1 flex-col gap-1.5 text-sm"><span>Find anime</span><input className={controlStyle} maxLength={120} value={draftSearch} onChange={(event) => setDraftSearch(event.target.value)} placeholder="Title or slug" /></label>
          <button className={`${controlStyle} border-primary bg-primary text-primary-foreground`} type="submit">Search</button>
          <label className="flex flex-col gap-1.5 text-sm"><span>Catalog status</span><select className={controlStyle} value={catalogStatus} onChange={(event) => { setCatalogStatus(event.target.value as AdminCatalogStatus | 'ALL'); setPage(1); }}><option value="ALL">All statuses</option><option value="INCLUDED">Included</option><option value="REVIEW">Review</option><option value="EXCLUDED">Excluded</option></select></label>
          <label className="flex flex-col gap-1.5 text-sm"><span>Age classification</span><select className={controlStyle} value={age} onChange={(event) => { setAge(event.target.value as AdminCatalogAge | 'ALL'); setPage(1); }}><option value="ALL">All classifications</option><option value="UNKNOWN">Unknown</option><option value="NON_ADULT">Flag false</option><option value="ADULT">Flag true</option></select></label>
        </form>
      </section>

      {loaded ? <section aria-label="Catalog results" className={cardStyle}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Anime records</h2><p className="text-sm text-muted-foreground">{loaded.result.pageInfo.total.toLocaleString()} results · page {loaded.result.pageInfo.page} of {Math.max(1, loaded.result.pageInfo.pageCount)}</p></div>
        {loaded.result.items.length === 0 ? <p role="status" className="py-8 text-center text-sm text-muted-foreground">No matching anime. Try different filters.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b border-border text-xs text-muted-foreground"><tr><th scope="col" className="px-2 py-3">Anime</th><th scope="col" className="px-2 py-3">Status</th><th scope="col" className="px-2 py-3">Format / year</th><th scope="col" className="px-2 py-3">Age</th><th scope="col" className="px-2 py-3">Synopsis</th><th scope="col" className="px-2 py-3">Cover field</th><th scope="col" className="px-2 py-3">Private draft</th></tr></thead><tbody>{loaded.result.items.map((anime) => <tr key={anime.id} className="border-b border-border/60 align-top"><td className="px-2 py-3"><p className="max-w-72 font-medium">{anime.title}</p><p className="mt-1 max-w-72 truncate text-xs text-muted-foreground">{anime.slug}</p>{anime.synopsisPreview ? <p className="mt-2 max-w-80 line-clamp-2 text-xs text-muted-foreground">{anime.synopsisPreview}</p> : null}</td><td className="px-2 py-3">{anime.catalogStatus}</td><td className="px-2 py-3">{anime.format} · {anime.seasonYear ?? '—'}</td><td className="px-2 py-3">{anime.isAdult === null ? 'Unknown' : anime.isAdult ? 'Adult' : 'Non-adult'}</td><td className="px-2 py-3">{anime.hasSynopsis ? 'Present' : 'Missing'}</td><td className="px-2 py-3">{anime.hasCover ? 'Present (rights unverified)' : 'Missing'}</td><td className="px-2 py-3"><Link href={`/admin/catalog/synopsis?animeId=${encodeURIComponent(anime.id)}`} className="text-primary underline">Draft synopsis</Link></td></tr>)}</tbody></table></div>}
        <div className="mt-5 flex justify-end gap-3"><button type="button" disabled={!loaded.result.pageInfo.hasPreviousPage} className={`${controlStyle} disabled:cursor-not-allowed disabled:opacity-40`} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</button><button type="button" disabled={!loaded.result.pageInfo.hasNextPage} className={`${controlStyle} disabled:cursor-not-allowed disabled:opacity-40`} onClick={() => setPage((p) => p + 1)}>Next</button></div>
      </section> : null}
      <p className="text-xs text-muted-foreground">A populated cover field does not imply artwork reuse rights. An unknown age classification must never be silently changed to non-adult.</p>
    </main>
  );
}
