import type { Metadata } from "next"
import Link from "next/link"
import { PageContainer } from "@/components/layout/page-container"
import { getPublicAnimeMusicPreview } from "@/lib/graphql/manga-music"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Anime Music | Anime Platform", description: "Source-attributed anime music catalogue preview. No streaming." }

export default async function MusicPage() {
  const tracks = await getPublicAnimeMusicPreview()
  return (
    <main><PageContainer><section className="mx-auto max-w-6xl space-y-6 py-10 sm:py-14">
      <header className="space-y-2"><p className="text-xs font-semibold uppercase tracking-widest text-primary">First-party catalogue</p>
        <h1 className="text-3xl font-bold tracking-tight">Anime Music</h1>
        <p className="text-sm text-muted-foreground">Opening, ending and soundtrack metadata from reviewed sources. No audio streaming or licensing claim.</p></header>
      {tracks.length === 0 ? (
        <div role="status" className="rounded-2xl border border-border bg-surface p-8">
          <h2 className="font-semibold">No published tracks yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">Music metadata will appear only after review and publication.</p>
          <Link className="mt-4 inline-block text-sm text-primary underline" href="/discover">Explore anime</Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tracks.map((item) => <li key={item.id} className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">{item.category.replaceAll("_", " ")}</p>
            <h2 className="mt-2 text-lg font-semibold">{item.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{item.artistName}</p>
            {item.animeSlug ? <p className="mt-3 text-sm"><Link className="text-primary underline" href={`/anime/${encodeURIComponent(item.animeSlug)}`}>Associated anime</Link></p> : null}
            <p className="mt-4 break-all text-xs text-muted-foreground">Source: {item.sourceName} · {item.sourceReference}</p>
          </li>)}
        </ul>
      )}
    </section></PageContainer></main>
  )
}
