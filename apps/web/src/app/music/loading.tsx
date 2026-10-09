import { PageContainer } from "@/components/layout/page-container"
export default function Loading() {
  return <main><PageContainer><div role="status" className="animate-pulse space-y-5 py-12" aria-label="Loading catalogue"><div className="h-8 w-44 rounded bg-muted" /><div className="h-4 w-80 max-w-full rounded bg-muted" /><div className="grid gap-4 sm:grid-cols-3">{[1,2,3].map((x) => <div key={x} className="h-40 rounded-2xl bg-muted" />)}</div></div></PageContainer></main>
}
