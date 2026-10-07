"use client"

import {
  ContentSection,
} from "@/components/layout/content-section"

import {
  PageContainer,
} from "@/components/layout/page-container"

type SeasonErrorProps = {
  error: Error & {
    digest?: string
  }

  reset: () => void
}

export default function SeasonError({
  error,
  reset,
}: SeasonErrorProps) {
  return (
    <main>
      <PageContainer>
        <ContentSection
          spacing="lg"
        >
          <div
            className="rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12"
          >
            <p
              className="text-xs font-medium uppercase tracking-[0.16em] text-destructive"
            >
              Seasonal
            </p>

            <h1
              className="mt-3 text-2xl font-semibold text-foreground"
            >
              Unable to load
              seasonal anime
            </h1>

            <p
              className="mt-2 max-w-xl text-sm text-muted-foreground"
            >
              {error.message ||
                "The seasonal catalog could not be loaded."}
            </p>

            <button
              type="button"
              onClick={
                reset
              }
              className="mt-6 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Try again
            </button>
          </div>
        </ContentSection>
      </PageContainer>
    </main>
  )
}