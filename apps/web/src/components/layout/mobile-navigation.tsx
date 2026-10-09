"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CompassIcon,
  UsersRoundIcon,
  HomeIcon,
  ListIcon,
  LogInIcon,
  UserIcon,
} from "lucide-react"

import {
  useAuth,
} from "@/components/auth/auth-provider"
import { cn } from "@/lib/utils"
import { isPrimaryNavActive } from "@/lib/navigation/navigation-policy"

function MobileNavigation() {
  const pathname = usePathname()

  const {
    user,
    status,
  } = useAuth()

  const isAuthenticated =
    status === "authenticated" &&
    user !== null

  const navigation = [
    {
      label: "Home", href: "/", icon: HomeIcon,
      isActive: (path: string) => isPrimaryNavActive(path, "home"),
    },
    {
      label: "Anime", href: "/discover", icon: CompassIcon,
      isActive: (path: string) => isPrimaryNavActive(path, "anime"),
    },
    {
      label: "Feed", href: "/feed", icon: UsersRoundIcon,
      isActive: (path: string) => isPrimaryNavActive(path, "feed"),
    },
    {
      label: "My List",
      href: isAuthenticated ? `/user/${user.username}/anime-list` : "/login",
      icon: ListIcon,
      isActive: (path: string) => isAuthenticated && path.endsWith("/anime-list"),
    },
    {
      label: isAuthenticated ? "Profile" : "Sign in",
      href: isAuthenticated ? `/user/${user.username}` : "/login",
      icon: isAuthenticated ? UserIcon : LogInIcon,
      isActive: (path: string) => isAuthenticated ? path === `/user/${user.username}` : path === "/login",
    },
  ]
  return (
    <nav
      data-slot="mobile-navigation"
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto grid h-16 max-w-lg grid-cols-5">
        {navigation.map(
          (item) => {
            const Icon =
              item.icon

            const active =
              item.isActive(
                pathname,
              )

            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={
                  active
                    ? "page"
                    : undefined
                }
                className={cn(
                  "relative flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-[0.6875rem] font-medium transition-colors outline-none",
                  "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/75",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon
                  aria-hidden="true"
                  className={cn(
                    "size-5",
                    active &&
                      "stroke-[2.25]",
                  )}
                />

                <span className="max-w-full truncate">
                  {item.label}
                </span>

                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-0 h-0.5 w-6 rounded-full bg-primary transition-opacity",
                    active
                      ? "opacity-100"
                      : "opacity-0",
                  )}
                />
              </Link>
            )
          },
        )}
      </div>
    </nav>
  )
}

export { MobileNavigation }