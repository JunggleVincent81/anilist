import {
  ContentSection,
} from "@/components/layout/content-section"

import {
  PageContainer,
} from "@/components/layout/page-container"

export default function SeasonLoading() {
  return (
    <main>
      <PageContainer>
        <ContentSection
          spacing="lg"
        >
          <div
            className="space-y-3"
          >
            <div
              className="h-3 w-20 animate-pulse rounded bg-muted"
            />

            <div
              className="h-9 w-56 animate-pulse rounded bg-muted"
            />

            <div
              className="h-4 w-80 max-w-full animate-pulse rounded bg-muted"
            />
          </div>

          <div
            className="flex gap-2"
          >
            {Array.from({
              length: 4,
            }).map(
              (_, index) => (
                <div
                  key={
                    index
                  }
                  className="h-8 w-24 animate-pulse rounded-md bg-muted"
                />
              ),
            )}
          </div>

          <div
            className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
          >
            {Array.from({
              length: 12,
            }).map(
              (_, index) => (
                <div
                  key={
                    index
                  }
                  className="space-y-3"
                >
                  <div
                    className="aspect-[2/3] animate-pulse rounded-xl bg-muted"
                  />

                  <div
                    className="h-4 animate-pulse rounded bg-muted"
                  />

                  <div
                    className="h-3 w-2/3 animate-pulse rounded bg-muted"
                  />
                </div>
              ),
            )}
          </div>
        </ContentSection>
      </PageContainer>
    </main>
  )
}