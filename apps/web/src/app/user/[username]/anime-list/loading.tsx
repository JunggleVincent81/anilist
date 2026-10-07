import {
  ContentSection,
} from "@/components/layout/content-section"
import {
  PageContainer,
} from "@/components/layout/page-container"

export default function AnimeListLoading() {
  return (
    <main>
      <PageContainer>
        <ContentSection spacing="lg">
          <div
            className="mx-auto w-full max-w-5xl"
            aria-busy="true"
            aria-label="Loading anime list"
          >
            <div className="animate-pulse">
              <div className="h-3 w-24 rounded bg-muted" />

              <div className="mt-3 h-10 w-52 max-w-full rounded bg-muted" />

              <div className="mt-4 h-4 w-full max-w-xl rounded bg-muted" />

              <div className="mt-8 flex gap-2 overflow-hidden">
                {Array.from({
                  length: 5,
                }).map(
                  (_, index) => (
                    <div
                      key={index}
                      className="h-8 w-24 shrink-0 rounded-lg bg-muted"
                    />
                  ),
                )}
              </div>

              <div className="mt-7 space-y-3">
                {Array.from({
                  length: 4,
                }).map(
                  (_, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[5rem_minmax(0,1fr)] gap-4 rounded-xl border p-3 sm:grid-cols-[6rem_minmax(0,1fr)_10rem] sm:p-4"
                    >
                      <div className="aspect-[2/3] rounded-lg bg-muted" />

                      <div className="space-y-3 py-2">
                        <div className="h-5 w-24 rounded bg-muted" />
                        <div className="h-5 w-3/4 rounded bg-muted" />
                        <div className="h-3 w-40 max-w-full rounded bg-muted" />
                      </div>

                      <div className="hidden space-y-3 border-l pl-5 sm:block">
                        <div className="h-4 w-20 rounded bg-muted" />
                        <div className="h-4 w-16 rounded bg-muted" />
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </ContentSection>
      </PageContainer>
    </main>
  )
}
