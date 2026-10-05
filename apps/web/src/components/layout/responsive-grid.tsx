import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

type ResponsiveGridProps =
  ComponentProps<"div"> & {
    variant?: "anime" | "cards"
  }

function ResponsiveGrid({
  className,
  variant = "anime",
  ...props
}: ResponsiveGridProps) {
  return (
    <div
      data-slot="responsive-grid"
      data-variant={variant}
      className={cn(
        "grid",

        variant === "anime" &&
          [
            "grid-cols-2",
            "gap-x-3 gap-y-6",
            "sm:grid-cols-3 sm:gap-x-4",
            "md:grid-cols-4",
            "lg:grid-cols-5 lg:gap-x-5",
            "xl:grid-cols-6",
          ].join(" "),

        variant === "cards" &&
          [
            "grid-cols-1",
            "gap-4",
            "md:grid-cols-2",
            "xl:grid-cols-3",
          ].join(" "),

        className,
      )}
      {...props}
    />
  )
}

export { ResponsiveGrid }