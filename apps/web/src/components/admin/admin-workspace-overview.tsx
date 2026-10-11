'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { fetchAdminWorkspaceOverview, type AdminWorkspaceOverview } from '@/lib/graphql/admin-workspace';

type Metric = { label: string; value: number | null };

function DomainPanel({ title, subtitle, available, metrics }: {
  title: string; subtitle: string; available: boolean; metrics: Metric[];
}) {
  return (
    <article className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <span className="rounded-full border border-border px-2 py-1 text-[11px] text-muted-foreground">
          {available ? 'Available' : 'Unavailable'}
        </span>
      </div>
      {!available ? (
        <p role="status" className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
          Metrics unavailable. Check whether this domain has been migrated and is accessible; no zero count is assumed.
        </p>
      ) : (
        <dl className="grid grid-cols-2 gap-3">
          {metrics.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums">{value === null ? '—' : value.toLocaleString()}</dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  );
}

/** Read-only ADMIN panel; never request candidate payloads or mutate public status. */
export function AdminWorkspaceOverviewPanel({ refresh }: { refresh: number }) {
  const { user, status } = useAuth();
  const authorized = status === 'authenticated' && user?.role === 'ADMIN';
  const [snapshot, setSnapshot] = useState<{
    refresh: number; data?: AdminWorkspaceOverview; error?: string;
  } | null>(null);

  useEffect(() => {
    if (!authorized) return;
    let active = true;
    void fetchAdminWorkspaceOverview()
      .then((data) => { if (active) setSnapshot({ refresh, data }); })
      .catch(() => { if (active) setSnapshot({ refresh, error: 'Cross-domain metrics could not be loaded.' }); });
    return () => { active = false; };
  }, [authorized, refresh]);

  if (!authorized) return null;
  const current = snapshot?.refresh === refresh ? snapshot : null;
  const data = current?.data;
  return (
    <section aria-label="Private workspace overview" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Workspace overview</h2>
          <p className="mt-1 text-sm text-muted-foreground">Private aggregate counts only. Approval and publication remain separately gated.</p>
        </div>
        <span className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">Read only</span>
      </div>
      {!current ? <p role="status" className="text-sm text-muted-foreground">Loading Manga, Music and editorial metrics…</p> : null}
      {current?.error ? <p role="alert" className="rounded-xl border border-destructive/50 p-3 text-sm">{current.error} The Anime catalog below remains available independently.</p> : null}
      {data ? (
        <div className="grid gap-3 lg:grid-cols-3">
          <DomainPanel title="Manga" subtitle="Canonical domain structures" available={data.manga.available}
            metrics={[{ label: 'Works', value: data.manga.works }, { label: 'Volumes', value: data.manga.volumes }, { label: 'Chapters', value: data.manga.chapters }]} />
          <DomainPanel title="Music" subtitle="Catalog entries, not streaming licenses" available={data.music.available}
            metrics={[{ label: 'Tracks', value: data.music.tracks }, { label: 'Artists', value: data.music.artists },
              { label: 'Recordings', value: data.music.recordings }, { label: 'Releases', value: data.music.releases },
              { label: 'Credits', value: data.music.credits }]} />
          <DomainPanel title="Editorial" subtitle="Quarantined candidates and private reviews" available={data.editorial.available}
            metrics={[{ label: 'Candidates', value: data.editorial.candidates }, { label: 'Quarantined', value: data.editorial.quarantined },
              { label: 'Cases', value: data.editorial.cases }, { label: 'Submitted', value: data.editorial.submitted },
              { label: 'Under review', value: data.editorial.underReview }, { label: 'Approved (private)', value: data.editorial.approved }]} />
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground">An editorial approval is not permission to publish an Anime, image, Manga or Music record.</p>
    </section>
  );
}
