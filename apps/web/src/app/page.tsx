'use client';

import { useEffect, useState } from 'react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/graphql';
const healthQuery = `query { health { status } }`;

type ConnectivityState = 'checking' | 'connected' | 'unavailable';

export default function Home() {
  const [connectivity, setConnectivity] = useState<ConnectivityState>('checking');

  useEffect(() => {
    const checkApi = async () => {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ query: healthQuery })
        });
        const payload = await response.json();
        setConnectivity(response.ok && payload.data?.health?.status === 'ok' ? 'connected' : 'unavailable');
      } catch {
        setConnectivity('unavailable');
      }
    };

    void checkApi();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-sky-400">Phase 1 Foundation</p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Anime Platform</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          Foundation page only. Product features, domain modules, and anime business logic are intentionally deferred.
        </p>

        <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/70 p-6" aria-labelledby="status-heading">
          <h2 id="status-heading" className="text-lg font-semibold">Foundation status</h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <dt className="text-sm text-slate-400">Frontend</dt>
              <dd className="mt-1 font-medium text-emerald-300">Next.js ready</dd>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <dt className="text-sm text-slate-400">GraphQL API</dt>
              <dd className={`mt-1 font-medium ${connectivity === 'connected' ? 'text-emerald-300' : connectivity === 'unavailable' ? 'text-amber-300' : 'text-slate-300'}`}>
                {connectivity === 'checking' ? 'Checking…' : connectivity === 'connected' ? 'Connected' : 'Unavailable'}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}
