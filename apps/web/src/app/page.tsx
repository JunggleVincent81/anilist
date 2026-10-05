"use client"

import { useEffect, useState } from "react"

import { ContentSection } from "@/components/layout/content-section"
import { PageContainer } from "@/components/layout/page-container"
import { SectionHeader } from "@/components/layout/section-header"

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000/graphql"

const healthQuery = `
  query {
    health {
      status
    }
  }
`

type ConnectivityState =
  | "checking"
  | "connected"
  | "unavailable"

export default function Home() {
  const [connectivity, setConnectivity] =
    useState<ConnectivityState>("checking")

  useEffect(() => {
    const checkApi = async () => {
      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "content-type":
              "application/json",
          },
          body: JSON.stringify({
            query: healthQuery,
          }),
        })

        const payload = await response.json()

        setConnectivity(
          response.ok &&
            payload.data?.health?.status === "ok"
            ? "connected"
            : "unavailable",
        )
      } catch {
        setConnectivity("unavailable")
      }
    }

    void checkApi()
  }, [])

  return (
    <main>
      <PageContainer>
        <ContentSection spacing="lg">
          <p className="text-caption font-semibold uppercase tracking-[0.22em] text-brand-accent">
            Phase 2 · UI Foundation
          </p>

          <h1 className="mt-3 text-display">
            Anime Platform
          </h1>

          <p className="mt-5 max-w-2xl text-muted-foreground">
            The visual foundation for an
            anime tracking, discovery,
            statistics, achievement, and
            social platform.
          </p>

          <section
            className="mt-10 rounded-xl border bg-surface p-6"
            aria-labelledby="status-heading"
          >
            <SectionHeader
              title="Foundation status"
              className="mb-5"
            />

            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border bg-background p-4">
                <dt className="text-small text-muted-foreground">
                  Frontend
                </dt>

                <dd className="mt-1 font-medium text-success">
                  Next.js ready
                </dd>
              </div>

              <div className="rounded-lg border bg-background p-4">
                <dt className="text-small text-muted-foreground">
                  GraphQL API
                </dt>

                <dd
                  className={
                    connectivity === "connected"
                      ? "mt-1 font-medium text-success"
                      : connectivity ===
                          "unavailable"
                        ? "mt-1 font-medium text-warning"
                        : "mt-1 font-medium text-muted-foreground"
                  }
                >
                  {connectivity === "checking"
                    ? "Checking…"
                    : connectivity === "connected"
                      ? "Connected"
                      : "Unavailable"}
                </dd>
              </div>
            </dl>
          </section>
        </ContentSection>
      </PageContainer>
    </main>
  )
}