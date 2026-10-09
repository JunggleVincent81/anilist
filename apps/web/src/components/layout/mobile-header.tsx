"use client"

import { NotificationsBell } from "@/components/social/notifications-bell"

import Link from "next/link"
import {
  MenuIcon,
  SearchIcon,
} from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import {
  buttonVariants,
} from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { PageContainer } from "./page-container"
import { ANIME_MENU_LINKS, CATALOG_MENU_LINKS } from "@/lib/navigation/navigation-policy"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function MobileHeader() {
  const { user } = useAuth()

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
                <Link
                  href="/discover"
                  aria-label="Search"
                  className={buttonVariants({
                    variant: "ghost",
                    size: "icon",
                  })}
                />
              }
            >
              <SearchIcon />
            </TooltipTrigger>

            <TooltipContent>
              Search
            </TooltipContent>
          </Tooltip>

          {user ? <NotificationsBell /> : null}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  aria-label="Browse sections"
                  className={buttonVariants({ variant: "ghost", size: "icon" })}
                />
              }
            >
              <MenuIcon aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="min-w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Anime</DropdownMenuLabel>
                {ANIME_MENU_LINKS.map((item) => (
                  <DropdownMenuItem key={item.href} render={<Link href={item.href} />}>
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Manga & Music</DropdownMenuLabel>
                {CATALOG_MENU_LINKS.map((item) => (
                  <DropdownMenuItem key={item.href} render={<Link href={item.href} />}>
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </PageContainer>
    </header>
  )
}

export { MobileHeader }