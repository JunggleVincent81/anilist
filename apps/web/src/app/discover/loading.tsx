import {
  ContentSection,
} from "@/components/layout/content-section"

import {
  PageContainer,
} from "@/components/layout/page-container"

function DiscoverLoading() {
  return (
    <main>
      <PageContainer>
        <ContentSection spacing="lg">
          <div className="space-y-3">
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />

            <div className="h-9 w-64 animate-pulse rounded-lg bg-muted" />

            <div className="h-4 w-96 max-w-full animate-pulse rounded bg-muted" />
          </div>

          <div className="h-16 animate-pulse rounded-xl border border-border bg-muted/30" />

          <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from(
              {
                length: 12,
              },
            ).map(
              (_, index) => (
                <div
                  key={
                    index
                  }
                >
                  <div className="aspect-[2/3] animate-pulse rounded-xl bg-muted" />

                  <div className="mt-3 h-4 animate-pulse rounded bg-muted" />

                  <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-muted" />
                </div>
              ),
            )}
          </div>
        </ContentSection>
      </PageContainer>
    </main>
  )
}

export default DiscoverLoading