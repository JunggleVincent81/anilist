import { ContentSection } from "@/components/layout/content-section"
import { PageContainer } from "@/components/layout/page-container"
import { SectionHeader } from "@/components/layout/section-header"

export default function SeasonPage() {
  return (
    <main>
      <PageContainer>
        <ContentSection spacing="lg">
          <SectionHeader
            eyebrow="Seasonal"
            title="Current anime season"
            description="Seasonal anime functionality will be implemented in a later phase."
          />
        </ContentSection>
      </PageContainer>
    </main>
  )
}