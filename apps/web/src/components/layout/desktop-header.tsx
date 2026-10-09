"use client"

import { NotificationsBell } from "@/components/social/notifications-bell"

import Link from "next/link"
import {
  usePathname,
  useRouter,
} from "next/navigation"
import {
  ChevronDownIcon,
  ListIcon,
  LogOutIcon,
  SearchIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react"

import {
  useAuth,
} from "@/components/auth/auth-provider"
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import {
  buttonVariants,
} from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import { ANIME_MENU_LINKS, FUTURE_CATEGORIES, isPrimaryNavActive } from "@/lib/navigation/navigation-policy"
import { PageContainer } from "./page-container"


function DesktopHeader() {
  const pathname = usePathname()
  const router = useRouter()

  const {
    user,
    status,
    logout,
  } = useAuth()

  const accountName =
    user?.displayName ??
    user?.username ??
    ""

  const avatarFallback =
    accountName
      .slice(0, 1)
      .toUpperCase() || "U"

  async function handleLogout() {
    try {
      await logout()

      router.replace("/")
      router.refresh()
    } catch {
      // Keep current authenticated state
      // if server-side revocation fails.
    }
  }

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
          className="flex h-full items-center gap-0.5"
        >
          <Link
            href="/"
            aria-current={isPrimaryNavActive(pathname, "home") ? "page" : undefined}
            className={cn(
              "relative flex h-full items-center px-2.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/75",
              isPrimaryNavActive(pathname, "home") ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            Home
            <span aria-hidden="true" className={cn("absolute inset-x-2.5 bottom-0 h-0.5 rounded-full bg-primary", isPrimaryNavActive(pathname, "home") ? "opacity-100" : "opacity-0")} />
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  aria-label="Anime sections"
                  className={cn(
                    "relative flex h-full items-center gap-1 px-2.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/75",
                    isPrimaryNavActive(pathname, "anime") ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                />
              }
            >
              Anime
              <ChevronDownIcon aria-hidden="true" className="size-3.5" />
              <span aria-hidden="true" className={cn("absolute inset-x-2.5 bottom-0 h-0.5 rounded-full bg-primary", isPrimaryNavActive(pathname, "anime") ? "opacity-100" : "opacity-0")} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={8} className="min-w-44">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Explore anime</DropdownMenuLabel>
                {ANIME_MENU_LINKS.map((item) => (
                  <DropdownMenuItem key={item.href} render={<Link href={item.href} />}>
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          {FUTURE_CATEGORIES.map((label) => (
            <span
              key={label}
              aria-disabled="true"
              title={`${label} catalog is planned for a future phase`}
              className="flex h-full cursor-not-allowed items-center px-2.5 text-sm font-medium text-muted-foreground/50"
            >
              {label}
            </span>
          ))}
          <Link
            href="/feed"
            aria-current={isPrimaryNavActive(pathname, "feed") ? "page" : undefined}
            className={cn(
              "relative flex h-full items-center px-2.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/75",
              isPrimaryNavActive(pathname, "feed") ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            Feed
            <span aria-hidden="true" className={cn("absolute inset-x-2.5 bottom-0 h-0.5 rounded-full bg-primary", isPrimaryNavActive(pathname, "feed") ? "opacity-100" : "opacity-0")} />
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
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

          <div
            aria-hidden="true"
            className="mx-2 h-6 w-px bg-border"
          />

          {status === "loading" ? (
            <div
              aria-label="Loading account"
              className="flex items-center gap-2 px-2"
            >
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    aria-label="Open profile menu"
                    className={buttonVariants({
                      variant: "ghost",
                      className:
                        "h-10 gap-2 px-2",
                    })}
                  />
                }
              >
                <Avatar size="sm">
                  <AvatarFallback>
                    {avatarFallback}
                  </AvatarFallback>
                </Avatar>

                <span className="max-w-28 truncate text-sm">
                  {accountName}
                </span>

                <ChevronDownIcon className="size-3.5 text-muted-foreground" />
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="min-w-52"
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <div className="min-w-0">
                      <p className="truncate">
                        {accountName}
                      </p>

                      <p className="truncate text-xs font-normal text-muted-foreground">
                        @{user.username}
                      </p>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    render={
                      <Link
                        href={`/user/${user.username}`}
                      />
                    }
                  >
                    <UserIcon />
                    Profile
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    render={
                      <Link
                        href={`/user/${user.username}/anime-list`}
                      />
                    }
                  >
                    <ListIcon />
                    Anime List
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    render={
                      <Link
                        href="/settings"
                      />
                    }
                  >
                    <SettingsIcon />
                    Settings
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => {
                    void handleLogout()
                  }}
                >
                  <LogOutIcon />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className={buttonVariants({
                  variant: "ghost",
                })}
              >
                Sign in
              </Link>

              <Link
                href="/register"
                className={buttonVariants()}
              >
                Create account
              </Link>
            </div>
          )}
        </div>
      </PageContainer>
    </header>
  )
}

export { DesktopHeader }