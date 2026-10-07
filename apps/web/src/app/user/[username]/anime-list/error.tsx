"use client"

import {
  RotateCcwIcon,
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

type AnimeListErrorProps = {
  error: Error & {
    digest?: string
  }

  reset: () => void
}

export default function AnimeListError({
  error,
  reset,
}: AnimeListErrorProps) {
  return (
    <main>
      <PageContainer>
        <ContentSection spacing="lg">
          <div className="mx-auto w-full max-w-5xl">
            <section className="rounded-2xl border border-dashed px-6 py-16 text-center">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Anime List
              </p>

              <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                Unable to load this list
              </h1>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                Something went wrong
                while loading the anime
                list. You can try the
                request again.
              </p>

              {error.digest ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Reference:{" "}
                  {error.digest}
                </p>
              ) : null}

              <Button
                className="mt-6"
                variant="outline"
                onClick={reset}
              >
                <RotateCcwIcon />
                Try again
              </Button>
            </section>
          </div>
        </ContentSection>
      </PageContainer>
    </main>
  )
}
