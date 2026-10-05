import { ContentSection } from "@/components/layout/content-section"
import { PageContainer } from "@/components/layout/page-container"
import { SectionHeader } from "@/components/layout/section-header"

export default function SchedulePage() {
  return (
    <main>
      <PageContainer>
        <ContentSection spacing="lg">
          <SectionHeader
            eyebrow="Schedule"
            title="Airing schedule"
            description="Anime airing schedules will be implemented in a later phase."
          />
        </ContentSection>
      </PageContainer>
    </main>
  )
}