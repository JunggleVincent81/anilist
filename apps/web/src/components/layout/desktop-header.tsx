"use client"

import Link from "next/link"
import {
  usePathname,
  useRouter,
} from "next/navigation"
import {
  BellIcon,
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
          className="flex h-full items-center gap-1"
        >
          {navigation.map((item) => {
            const active =
              pathname === item.href ||
              pathname.startsWith(
                `${item.href}/`,
              )

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={
                  active
                    ? "page"
                    : undefined
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

          {user ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    aria-label="Notifications"
                    className={buttonVariants({
                      variant: "ghost",
                      size: "icon",
                      className: "relative",
                    })}
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
          ) : null}

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