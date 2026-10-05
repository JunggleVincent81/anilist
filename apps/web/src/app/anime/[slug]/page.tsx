import { ContentSection } from "@/components/layout/content-section"
import { PageContainer } from "@/components/layout/page-container"
import { SectionHeader } from "@/components/layout/section-header"

type AnimePageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function AnimePage({
  params,
}: AnimePageProps) {
  const { slug } = await params

  return (
    <main>
      <PageContainer>
        <ContentSection spacing="lg">
          <SectionHeader
            eyebrow="Anime"
            title={slug
              .split("-")
              .map(
                (word) =>
                  word
                    .charAt(0)
                    .toUpperCase() +
                  word.slice(1),
              )
              .join(" ")}
            description="Anime detail functionality will be implemented in a later phase."
          />
        </ContentSection>
      </PageContainer>
    </main>
  )
}