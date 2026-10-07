import {
  ContentSection,
} from "@/components/layout/content-section"
import {
  PageContainer,
} from "@/components/layout/page-container"
import {
  Skeleton,
} from "@/components/ui/skeleton"

export default function AnimeDetailLoading() {
  return (
    <main>
      <PageContainer>
        <ContentSection spacing="lg">
          <section className="rounded-2xl border bg-card p-6 lg:p-8">
            <div className="grid gap-6 md:grid-cols-[11rem_minmax(0,1fr)] md:items-center md:gap-8">
              <Skeleton className="mx-auto aspect-[2/3] w-36 rounded-xl md:mx-0 md:w-44" />

              <div className="space-y-4">
                <Skeleton className="h-3 w-16" />

                <Skeleton className="h-10 w-full max-w-2xl" />

                <Skeleton className="h-5 w-1/2 max-w-md" />

                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-7 w-20 rounded-full" />
                  <Skeleton className="h-7 w-24 rounded-full" />
                  <Skeleton className="h-7 w-20 rounded-full" />
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="space-y-10">
              <div className="space-y-4">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-8 w-32" />

                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              </div>

              <div className="space-y-4">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-44" />

                <div className="flex flex-wrap gap-2">
                  {Array.from({
                    length: 8,
                  }).map(
                    (_, index) => (
                      <Skeleton
                        key={index}
                        className="h-7 w-24 rounded-full"
                      />
                    ),
                  )}
                </div>
              </div>
            </div>

            <Skeleton className="h-72 rounded-xl" />
          </div>
        </ContentSection>
      </PageContainer>
    </main>
  )
}