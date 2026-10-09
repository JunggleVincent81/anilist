type HomeSectionLoadingProps = {
  label: string
  variant: "hero" | "grid"
}

// Server-safe, static loading states. No sample anime, fake scores or fake reviews.
export function HomeSectionLoading({ label, variant }: HomeSectionLoadingProps) {
  return (
    <section role="status" aria-label={`Loading ${label}`} className="rounded-2xl border border-border bg-surface p-5 sm:p-7">
      <p className="text-xs font-medium text-muted-foreground">Loading {label}…</p>
      <div aria-hidden="true" className="mt-5 space-y-3 animate-pulse motion-reduce:animate-none">
        <div className="h-3 w-24 max-w-full rounded bg-muted" />
        <div className="h-6 w-3/5 max-w-full rounded bg-muted" />
        <div className="h-3 w-4/5 max-w-full rounded bg-muted" />
        {variant === "grid" ? (
          <div className="grid grid-cols-2 gap-3 pt-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((item) => <div key={item} className="h-20 rounded-lg bg-muted" />)}
          </div>
        ) : <div className="h-12 w-2/5 max-w-full rounded-lg bg-muted" />}
      </div>
    </section>
  )
}
