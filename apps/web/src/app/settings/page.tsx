import type {
  Metadata,
} from "next"

import {
  ContentSection,
} from "@/components/layout/content-section"
import {
  PageContainer,
} from "@/components/layout/page-container"
import {
  ProfileSettingsForm,
} from "@/components/settings/profile-settings-form"

export const metadata: Metadata = {
  title: "Settings",
}

export default function SettingsPage() {
  return (
    <main>
      <PageContainer>
        <ContentSection spacing="lg">
          <div className="mx-auto w-full max-w-2xl">
            <header className="mb-8 space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
                Account
              </p>

              <h1 className="text-3xl font-semibold tracking-tight">
                Profile settings
              </h1>

              <p className="text-sm leading-6 text-muted-foreground">
                Manage how your identity
                appears across the
                platform.
              </p>
            </header>

            <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
              <ProfileSettingsForm />
            </section>
          </div>
        </ContentSection>
      </PageContainer>
    </main>
  )
}