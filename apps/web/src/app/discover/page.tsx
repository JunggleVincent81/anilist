import { ContentSection } from "@/components/layout/content-section"
import { PageContainer } from "@/components/layout/page-container"
import { SectionHeader } from "@/components/layout/section-header"

export default function DiscoverPage() {
  return (
    <main>
      <PageContainer>
        <ContentSection spacing="lg">
          <SectionHeader
            eyebrow="Discover"
            title="Find your next anime"
            description="Discovery functionality will be implemented in a later phase."
          />
        </ContentSection>
      </PageContainer>
    </main>
  )
}