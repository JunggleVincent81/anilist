import { ContentSection } from "@/components/layout/content-section"
import { PageContainer } from "@/components/layout/page-container"
import { SectionHeader } from "@/components/layout/section-header"

type AnimeListPageProps = {
  params: Promise<{
    username: string
  }>
}

export default async function AnimeListPage({
  params,
}: AnimeListPageProps) {
  const { username } = await params

  return (
    <main>
      <PageContainer>
        <ContentSection spacing="lg">
          <SectionHeader
            eyebrow="Anime List"
            title={`${username}'s anime`}
            description="Anime tracking and list functionality will be implemented in Phase 6."
          />
        </ContentSection>
      </PageContainer>
    </main>
  )
}