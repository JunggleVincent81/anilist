"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BellIcon,
  ChevronDownIcon,
  SearchIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import { PageContainer } from "./page-container"

const navigation = [
  {
    label: "Discover",
    href: "/discover",
  },
  {
    label: "Seasonal",
    href: "/season",
  },
  {
    label: "Schedule",
    href: "/schedule",
  },
]

function DesktopHeader() {
  const pathname = usePathname()

  return (
    <header
      data-slot="desktop-header"
      className="sticky top-0 z-40 hidden h-16 border-b border-border/80 bg-background/85 backdrop-blur-xl lg:block"
    >
      <PageContainer className="flex h-full items-center gap-8">
        <Link
          href="/"
          aria-label="Anime Platform home"
          className="group flex shrink-0 items-center gap-2.5 outline-none"
        >
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm shadow-black/20 transition-transform group-hover:scale-[1.03]"
          >
            A
          </span>

          <span className="font-heading text-base font-semibold tracking-tight text-foreground">
            Anime Platform
          </span>
        </Link>

        <nav
          aria-label="Main navigation"
          className="flex h-full items-center gap-1"
        >
          {navigation.map((item) => {
            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={
                  active ? "page" : undefined
                }
                className={cn(
                  "relative flex h-full items-center px-3 text-sm font-medium transition-colors outline-none",
                  "focus-visible:ring-2 focus-visible:ring-ring/75",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}

                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary transition-opacity",
                    active
                      ? "opacity-100"
                      : "opacity-0",
                  )}
                />
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
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

          <div
            aria-hidden="true"
            className="mx-2 h-6 w-px bg-border"
          />

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  className="h-10 gap-2 px-2"
                  aria-label="Open profile menu"
                />
              }
            >
              <Avatar size="sm">
                <AvatarFallback>
                  U
                </AvatarFallback>
              </Avatar>

              <span className="max-w-28 truncate text-sm">
                User
              </span>

              <ChevronDownIcon className="size-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="min-w-52"
            >
              <DropdownMenuLabel>
                My account
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem>
                <UserIcon />
                Profile
              </DropdownMenuItem>

              <DropdownMenuItem>
                <SettingsIcon />
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </PageContainer>
    </header>
  )
}

export { DesktopHeader }