import type { ReactNode } from "react"

import { DesktopHeader } from "./desktop-header"
import { MobileHeader } from "./mobile-header"
import { MobileNavigation } from "./mobile-navigation"

type AppShellProps = {
  children: ReactNode
}

function AppShell({
  children,
}: AppShellProps) {
  return (
    <div
      data-slot="app-shell"
      className="min-h-dvh bg-background text-foreground"
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>

      <DesktopHeader />

      <MobileHeader />

      <div
        id="main-content"
        data-slot="app-shell-content"
        tabIndex={-1}
        className="pb-[calc(4rem+env(safe-area-inset-bottom))] focus:outline-none lg:pb-0"
      >
        {children}
      </div>

      <MobileNavigation />
    </div>
  )
}

export { AppShell }