import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowUpRight, CalendarDays, Compass, Sparkles } from "lucide-react"
import { ContentSection } from "@/components/layout/content-section"
import { PageContainer } from "@/components/layout/page-container"
import { FeaturedAnimeSpotlight } from "@/components/home/featured-anime-spotlight"
import { HomeSeasonAndAiring } from "@/components/home/home-season-airing"
import { HomeCommunityPulseAndReviews } from "@/components/home/home-community-pulse-and-reviews"
import { HomeCommunityRanking } from "@/components/home/home-community-ranking"
import { HomeSectionLoading } from "@/components/home/home-section-loading"

// Prevent build-time static prerendering of the live GraphQL spotlight.
export const dynamic = "force-dynamic"

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
            <Suspense fallback={<HomeSectionLoading label="Featured anime" variant="hero" />}>
              <FeaturedAnimeSpotlight />
            </Suspense>
            <Suspense fallback={<HomeSectionLoading label="Seasonal anime and airing schedule" variant="grid" />}>
              <HomeSeasonAndAiring />
            </Suspense>

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

            <Suspense fallback={<HomeSectionLoading label="Community ranking" variant="grid" />}><HomeCommunityRanking /></Suspense>
            <Suspense fallback={<HomeSectionLoading label="Community updates and reviews" variant="grid" />}>
              <HomeCommunityPulseAndReviews />
            </Suspense>
            <footer aria-label="Homepage footer" className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground">
              <p>Anime discovery, tracking, and community. No streaming.</p>
              <nav aria-label="Homepage quick links" className="flex flex-wrap items-center gap-x-5 gap-y-1">
                <Link href="/discover" className="inline-flex min-h-11 items-center hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Anime database</Link>
                <Link href="/feed" className="inline-flex min-h-11 items-center hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Community feed</Link>
              </nav>
            </footer>
          </div>
        </ContentSection>
      </PageContainer>
    </main>
  )
}
