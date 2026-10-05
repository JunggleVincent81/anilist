"use client"

import Link from "next/link"
import {
  BellIcon,
  SearchIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { PageContainer } from "./page-container"

function MobileHeader() {
  return (
    <header
      data-slot="mobile-header"
      className="sticky top-0 z-40 border-b border-border/80 bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl lg:hidden"
    >
      <PageContainer className="flex h-14 items-center justify-between">
        <Link
          href="/"
          aria-label="Anime Platform home"
          className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring/75"
        >
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm shadow-black/20"
          >
            A
          </span>

          <span className="font-heading text-sm font-semibold tracking-tight">
            Anime Platform
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Search"
                />
              }
            >
              <SearchIcon />
            </TooltipTrigger>

            <TooltipContent>
              Search
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Notifications"
                  className="relative"
                />
              }
            >
              <BellIcon />

              <span
                aria-hidden="true"
                className="absolute top-2 right-2 size-1.5 rounded-full bg-primary ring-2 ring-background"
              />
            </TooltipTrigger>

            <TooltipContent>
              Notifications
            </TooltipContent>
          </Tooltip>
        </div>
      </PageContainer>
    </header>
  )
}

export { MobileHeader }