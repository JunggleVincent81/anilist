"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CalendarDaysIcon,
  CompassIcon,
  HomeIcon,
  ListIcon,
  UserIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

const navigation = [
  {
    label: "Home",
    href: "/",
    icon: HomeIcon,
    isActive: (pathname: string) =>
      pathname === "/",
  },
  {
    label: "Discover",
    href: "/discover",
    icon: CompassIcon,
    isActive: (pathname: string) =>
      pathname === "/discover" ||
      pathname.startsWith("/discover/"),
  },
  {
    label: "My List",
    href: "/user/user/anime-list",
    icon: ListIcon,
    isActive: (pathname: string) =>
      pathname.endsWith("/anime-list"),
  },
  {
    label: "Seasonal",
    href: "/season",
    icon: CalendarDaysIcon,
    isActive: (pathname: string) =>
      pathname === "/season" ||
      pathname.startsWith("/season/"),
  },
  {
    label: "Profile",
    href: "/user/user",
    icon: UserIcon,
    isActive: (pathname: string) =>
      pathname.startsWith("/user/") &&
      !pathname.endsWith("/anime-list"),
  },
]

function MobileNavigation() {
  const pathname = usePathname()

  return (
    <nav
      data-slot="mobile-navigation"
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto grid h-16 max-w-lg grid-cols-5">
        {navigation.map((item) => {
          const Icon = item.icon
          const active =
            item.isActive(pathname)

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={
                active ? "page" : undefined
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
        })}
      </div>
    </nav>
  )
}

export { MobileNavigation }