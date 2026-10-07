import Link from "next/link"

import {
  ContentSection,
} from "@/components/layout/content-section"
import {
  PageContainer,
} from "@/components/layout/page-container"
import {
  buttonVariants,
} from "@/components/ui/button"

export default function AnimeNotFound() {
  return (
    <main>
      <PageContainer>
        <ContentSection spacing="lg">
          <div className="mx-auto max-w-xl py-20 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              404
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Anime not found
            </h1>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              This anime does not exist or is not available in the public catalog.
            </p>

            <div className="mt-7">
              <Link
                href="/discover"
                className={buttonVariants({
                  variant:
                    "outline",
                })}
              >
                Browse anime
              </Link>
            </div>
          </div>
        </ContentSection>
      </PageContainer>
    </main>
  )
}