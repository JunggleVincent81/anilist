import {
  ContentSection,
} from "@/components/layout/content-section"

import {
  PageContainer,
} from "@/components/layout/page-container"

export default function AchievementsLoading() {
  return (
    <main>
      <PageContainer>
        <ContentSection spacing="lg">
          <div className="mx-auto w-full max-w-6xl animate-pulse">
            <div className="border-b pb-6">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="mt-3 h-9 w-72 max-w-full rounded bg-muted" />
              <div className="mt-3 h-4 w-96 max-w-full rounded bg-muted" />
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {Array.from({
                length: 3,
              }).map(
                (
                  _,
                  index,
                ) => (
                  <div
                    key={
                      index
                    }
                    className="h-36 rounded-2xl border bg-muted/30"
                  />
                ),
              )}
            </div>

            <div className="mt-12 h-7 w-48 rounded bg-muted" />

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {Array.from({
                length: 6,
              }).map(
                (
                  _,
                  index,
                ) => (
                  <div
                    key={
                      index
                    }
                    className="h-52 rounded-2xl border bg-muted/30"
                  />
                ),
              )}
            </div>
          </div>
        </ContentSection>
      </PageContainer>
    </main>
  )
}
