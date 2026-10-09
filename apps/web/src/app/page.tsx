import type { Metadata } from "next"
import { ActivityFeed } from "@/components/social/activity-feed"
import { ContentSection } from "@/components/layout/content-section"
import { PageContainer } from "@/components/layout/page-container"

export const metadata: Metadata = {
  title: "Activity feed | Anime Platform",
  description: "Anime community activity, posts, and conversations.",
}

export default function HomePage() {
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
