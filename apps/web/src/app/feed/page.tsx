import type { Metadata } from "next"
import { ActivityFeed } from "@/components/social/activity-feed"
import { ContentSection } from "@/components/layout/content-section"
import { PageContainer } from "@/components/layout/page-container"

export const metadata: Metadata = {
  title: "Feed | Anime Platform",
  description: "Anime community activity, posts, and conversations.",
}

export default function FeedPage() {
  return (
    <main>
      <PageContainer>
        <ContentSection spacing="lg">
          <ActivityFeed />
        </ContentSection>
      </PageContainer>
    </main>
  )
}
