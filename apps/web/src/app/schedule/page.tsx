import Link from "next/link"

import {
  AiringScheduleList,
} from "@/components/anime/airing-schedule-list"
import {
  ContentSection,
} from "@/components/layout/content-section"
import {
  PageContainer,
} from "@/components/layout/page-container"
import {
  SectionHeader,
} from "@/components/layout/section-header"
import {
  buttonVariants,
} from "@/components/ui/button"
import {
  getAiringSchedule,
} from "@/lib/graphql/airing"

export const dynamic =
  "force-dynamic"

type SchedulePageProps = {
  searchParams:
    Promise<{
      days?:
        string | string[]
    }>
}

const RANGE_OPTIONS = [
  3,
  7,
  14,
] as const

function firstValue(
  value:
    | string
    | string[]
    | undefined,
): string | undefined {
  if (
    Array.isArray(value)
  ) {
    return value[0]
  }

  return value
}

function parseDays(
  value:
    | string
    | undefined,
): number {
  const parsed =
    Number(value)

  if (
    RANGE_OPTIONS.includes(
      parsed as
        (typeof RANGE_OPTIONS)[number],
    )
  ) {
    return parsed
  }

  return 7
}

export default async function SchedulePage({
  searchParams,
}: SchedulePageProps) {
  const params =
    await searchParams

  const days =
    parseDays(
      firstValue(
        params.days,
      ),
    )

  const schedule =
    await getAiringSchedule(
      days,
    )

  return (
    <main>
      <PageContainer>
        <ContentSection spacing="lg">
          <div className="mx-auto w-full max-w-5xl">
            <SectionHeader
              eyebrow="Schedule"
              title="Upcoming episodes"
              description="Future episode times matched against anime in the platform catalog."
            />

            <div className="mt-6 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {RANGE_OPTIONS.map(
                  (
                    option,
                  ) => (
                    <Link
                      key={
                        option
                      }
                      href={
                        option ===
                        7
                          ? "/schedule"
                          : `/schedule?days=${option}`
                      }
                      className={
                        buttonVariants({
                          variant:
                            days ===
                            option
                              ? "default"
                              : "outline",

                          size:
                            "sm",
                        })
                      }
                    >
                      Next{" "}
                      {
                        option
                      }{" "}
                      days
                    </Link>
                  ),
                )}
              </div>

              <p className="text-xs leading-5 text-muted-foreground">
                Times automatically use
                your device timezone
                after the page loads.
              </p>
            </div>

            <div className="mt-8">
              <AiringScheduleList
                items={
                  schedule.items
                }
              />
            </div>

            <div className="mt-10 rounded-xl border bg-muted/20 p-4 text-xs leading-5 text-muted-foreground">
              Episode timing comes from
              the airing provider and is
              matched to the platform&apos;s
              canonical anime catalog.
              Schedule information may
              change when broadcasters
              revise release times.
            </div>
          </div>
        </ContentSection>
      </PageContainer>
    </main>
  )
}
