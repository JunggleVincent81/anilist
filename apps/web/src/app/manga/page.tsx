import type { Metadata } from "next"
import Link from "next/link"
import { PageContainer } from "@/components/layout/page-container"
import { getPublicMangaPreview } from "@/lib/graphql/manga-music"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Manga | Anime Platform", description: "Source-attributed manga catalogue preview." }

export default async function MangaPage() {
  const titles = await getPublicMangaPreview()
  return (
    <main><PageContainer><section className="mx-auto max-w-6xl space-y-6 py-10 sm:py-14">
      <header className="space-y-2"><p className="text-xs font-semibold uppercase tracking-widest text-primary">First-party catalogue</p>
        <h1 className="text-3xl font-bold tracking-tight">Manga</h1>
        <p className="text-sm text-muted-foreground">Only reviewed, published, non-adult manga are shown. This is a limited preview, not a complete external ranking.</p></header>
      {titles.length === 0 ? (
        <div role="status" className="rounded-2xl border border-border bg-surface p-8">
          <h2 className="font-semibold">No published manga yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">The catalogue is being curated. No placeholder titles are displayed.</p>
          <Link className="mt-4 inline-block text-sm text-primary underline" href="/discover">Browse anime instead</Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {titles.map((item) => <li key={item.id} className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold">{item.title}</h2>
            <p className="mt-2 line-clamp-4 text-sm text-muted-foreground">{item.synopsis || "Synopsis unavailable."}</p>
            <p className="mt-4 break-all text-xs text-muted-foreground">Source: {item.sourceName} · {item.sourceReference}</p>
          </li>)}
        </ul>
      )}
    </section></PageContainer></main>
  )
}
