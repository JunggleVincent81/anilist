import type { Metadata } from "next"
import { Geist } from "next/font/google"

import { AppShell } from "@/components/layout/app-shell"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import "./globals.css"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Anime Platform",
  description:
    "Anime tracking and discovery platform.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "dark font-sans antialiased",
        geist.variable,
      )}
    >
      <body>
        <TooltipProvider>
          <AppShell>
            {children}
          </AppShell>

          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  )
}