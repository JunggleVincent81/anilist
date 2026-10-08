"use client"

import {
  AlertTriangleIcon,
} from "lucide-react"

import {
  ContentSection,
} from "@/components/layout/content-section"

import {
  PageContainer,
} from "@/components/layout/page-container"

import {
  Button,
} from "@/components/ui/button"

type AchievementsErrorProps = {
  reset: () => void
}

export default function AchievementsError({
  reset,
}: AchievementsErrorProps) {
  return (
    <main>
      <PageContainer>
        <ContentSection spacing="lg">
          <div className="mx-auto w-full max-w-3xl rounded-2xl border border-dashed px-6 py-16 text-center">
            <AlertTriangleIcon
              aria-hidden="true"
              className="mx-auto size-7 text-muted-foreground"
            />

            <h1 className="mt-4 text-xl font-semibold tracking-tight">
              Unable to load achievements
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              The achievement profile
              could not be loaded.
              Try the request again.
            </p>

            <Button
              className="mt-6"
              variant="outline"
              onClick={
                reset
              }
            >
              Try again
            </Button>
          </div>
        </ContentSection>
      </PageContainer>
    </main>
  )
}
