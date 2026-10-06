import Link from "next/link"
import { notFound } from "next/navigation"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ContentSection } from "@/components/layout/content-section"
import { PageContainer } from "@/components/layout/page-container"
import {
  getUserProfile,
} from "@/lib/graphql/users"

type UserProfilePageProps = {
  params: Promise<{
    username: string
  }>
}

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const { username } = await params

  const profile =
    await getUserProfile(username)

  if (!profile) {
    notFound()
  }

  const accountName =
    profile.displayName ??
    profile.username

  const fallback =
    accountName
      .slice(0, 1)
      .toUpperCase()

  const joinedAt =
    new Intl.DateTimeFormat(
      "en",
      {
        month: "long",
        year: "numeric",
      },
    ).format(
      new Date(profile.createdAt),
    )

  return (
    <main>
      <PageContainer>
        <ContentSection spacing="lg">
          <div className="mx-auto w-full max-w-4xl">
            <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <Avatar className="size-24">
                  {profile.avatarUrl ? (
                    <AvatarImage
                      src={
                        profile.avatarUrl
                      }
                      alt=""
                    />
                  ) : null}

                  <AvatarFallback className="text-2xl">
                    {fallback}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-semibold tracking-tight">
                      {accountName}
                    </h1>

                    {profile.role !==
                    "USER" ? (
                      <Badge variant="secondary">
                        {profile.role}
                      </Badge>
                    ) : null}
                  </div>

                  <p className="mt-1 text-sm text-muted-foreground">
                    @{profile.username}
                  </p>

                  <p className="mt-5 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-foreground/90">
                    {profile.bio ??
                      "No bio yet."}
                  </p>

                  <p className="mt-5 text-xs text-muted-foreground">
                    Joined {joinedAt}
                  </p>
                </div>
              </div>
            </section>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <Button
                variant="outline"
                render={
                  <Link
                    href={`/user/${profile.username}/anime-list`}
                  />
                }
              >
                Anime List
              </Button>

              <Button
                variant="outline"
                disabled
              >
                Statistics
              </Button>

              <Button
                variant="outline"
                disabled
              >
                Achievements
              </Button>
            </div>
          </div>
        </ContentSection>
      </PageContainer>
    </main>
  )
}