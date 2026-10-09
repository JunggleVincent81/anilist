"use client"
import { PageContainer } from "@/components/layout/page-container"
export default function CatalogueError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main><PageContainer><div role="alert" className="mx-auto my-12 max-w-lg rounded-2xl border border-destructive/30 p-6"><h1 className="text-xl font-semibold">Catalogue unavailable</h1><p className="mt-2 text-sm text-muted-foreground">Unable to reach the catalogue service. Please retry after the API and database are available.</p><button className="mt-4 rounded-lg border border-border px-4 py-2 text-sm" type="button" onClick={reset}>Try again</button></div></PageContainer></main>
}
