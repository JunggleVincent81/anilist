import { ContentSection } from "@/components/layout/content-section"
import { PageContainer } from "@/components/layout/page-container"
import { SectionHeader } from "@/components/layout/section-header"

type UserProfilePageProps = {
  params: Promise<{
    username: string
  }>
}

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const { username } = await params

  return (
    <main>
      <PageContainer>
        <ContentSection spacing="lg">
          <SectionHeader
            eyebrow="Profile"
            title={`@${username}`}
            description="Profile functionality will be implemented in a later phase."
          />
        </ContentSection>
      </PageContainer>
    </main>
  )
}