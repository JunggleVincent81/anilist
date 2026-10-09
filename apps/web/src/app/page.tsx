import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight, CalendarDays, Compass, MessagesSquare, Sparkles } from "lucide-react"
import { ContentSection } from "@/components/layout/content-section"
import { PageContainer } from "@/components/layout/page-container"

export const metadata: Metadata = {
  title: "Home | Anime Platform",
  description: "Explore the anime database, discover seasonal series, check airing schedules, and connect with anime fans.",
}

const animeDestinations = [
  {
    title: "Browse anime",
    description: "Explore titles, formats, and series in the anime catalog.",
    href: "/discover",
    label: "Open database",
    Icon: Compass,
  },
  {
    title: "Seasonal anime",
    description: "Discover shows by season and release year.",
    href: "/season",
    label: "Explore seasons",
    Icon: Sparkles,
  },
  {
    title: "Airing schedule",
    description: "See upcoming episode times from the available schedule.",
    href: "/schedule",
    label: "View schedule",
    Icon: CalendarDays,
  },
] as const

export default function HomePage() {
  return (
    <main>
      <PageContainer>
        <ContentSection spacing="lg">
          <div className="mx-auto w-full max-w-6xl space-y-9 pb-16 sm:space-y-12">
            <section
              aria-labelledby="home-intro-title"
              className="rounded-2xl border border-border bg-surface px-5 py-8 sm:px-8 sm:py-10"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Anime discovery & community
              </p>
              <h1 id="home-intro-title" className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
                Discover anime. Connect with fans.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                Find anime to explore, check what is airing, and share the stories you love
                with the community. Everything begins with the titles and people you care about.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/discover"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Explore anime <ArrowUpRight aria-hidden="true" className="size-4" />
                </Link>
                <Link
                  href="/feed"
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Community feed <ArrowUpRight aria-hidden="true" className="size-4" />
                </Link>
              </div>
            </section>

            <section aria-labelledby="anime-paths-title">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Anime database</p>
                <h2 id="anime-paths-title" className="mt-2 text-2xl font-bold tracking-tight">Explore anime</h2>
                <p className="mt-2 text-sm text-muted-foreground">Start with the catalog, seasonal discovery, or airing information.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {animeDestinations.map(({ title, description, href, label, Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:p-6"
                  >
                    <Icon aria-hidden="true" className="size-5 text-primary" />
                    <h3 className="mt-4 font-semibold">{title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{description}</p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                      {label} <ArrowUpRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            <section aria-labelledby="home-community-title" className="rounded-2xl border border-border bg-surface p-5 sm:p-7">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div className="max-w-2xl">
                  <MessagesSquare aria-hidden="true" className="size-5 text-primary" />
                  <h2 id="home-community-title" className="mt-3 text-xl font-semibold">From the community</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Read updates from anime fans, publish your thoughts, and join conversations.
                    Your full activity feed now lives on its own page.
                  </p>
                </div>
                <Link
                  href="/feed"
                  className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:self-center"
                >
                  Open feed <ArrowUpRight aria-hidden="true" className="size-4" />
                </Link>
              </div>
            </section>
          </div>
        </ContentSection>
      </PageContainer>
    </main>
  )
}
