import type { Metadata } from "next"
import { NotificationsInbox } from "@/components/social/notifications-inbox"
import { ContentSection } from "@/components/layout/content-section"
import { PageContainer } from "@/components/layout/page-container"

export const metadata: Metadata = {
  title: "Notifications | Anime Platform",
  description: "Your private social notifications and alerts.",
}

export default function NotificationsPage() {
  return (
    <main>
      <PageContainer>
        <ContentSection spacing="lg">
          <NotificationsInbox />
        </ContentSection>
      </PageContainer>
    </main>
  )
}
