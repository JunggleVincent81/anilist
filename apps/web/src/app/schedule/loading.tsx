import {
  ContentSection,
} from "@/components/layout/content-section"
import {
  PageContainer,
} from "@/components/layout/page-container"

export default function ScheduleLoading() {
  return (
    <main>
      <PageContainer>
        <ContentSection spacing="lg">
          <div className="mx-auto w-full max-w-5xl animate-pulse">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="mt-4 h-10 w-72 max-w-full rounded bg-muted" />
            <div className="mt-3 h-4 w-96 max-w-full rounded bg-muted" />

            <div className="mt-10 space-y-8">
              {[
                1,
                2,
                3,
              ].map(
                (
                  group,
                ) => (
                  <div
                    key={
                      group
                    }
                  >
                    <div className="mb-4 h-6 w-44 rounded bg-muted" />

                    <div className="divide-y rounded-2xl border">
                      {[
                        1,
                        2,
                        3,
                      ].map(
                        (
                          row,
                        ) => (
                          <div
                            key={
                              row
                            }
                            className="h-20"
                          />
                        ),
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </ContentSection>
      </PageContainer>
    </main>
  )
}
