"use client"

import Link from "next/link"

import {
  ContentSection,
} from "@/components/layout/content-section"
import {
  PageContainer,
} from "@/components/layout/page-container"
import {
  Button,
  buttonVariants,
} from "@/components/ui/button"

type AnimeDetailErrorProps = {
  error: Error & {
    digest?: string
  }

  reset: () => void
}

export default function AnimeDetailError({
  reset,
}: AnimeDetailErrorProps) {
  return (
    <main>
      <PageContainer>
        <ContentSection spacing="lg">
          <div className="mx-auto max-w-xl py-20 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Anime
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Unable to load anime
            </h1>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Something went wrong while loading this anime.
            </p>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button
                onClick={
                  reset
                }
              >
                Try again
              </Button>

              <Link
                href="/discover"
                className={buttonVariants({
                  variant:
                    "outline",
                })}
              >
                Back to Discover
              </Link>
            </div>
          </div>
        </ContentSection>
      </PageContainer>
    </main>
  )
}