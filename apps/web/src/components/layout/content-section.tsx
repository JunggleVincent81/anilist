import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

type ContentSectionProps =
  ComponentProps<"section"> & {
    spacing?: "sm" | "default" | "lg"
  }

function ContentSection({
  className,
  spacing = "default",
  ...props
}: ContentSectionProps) {
  return (
    <section
      data-slot="content-section"
      data-spacing={spacing}
      className={cn(
        "w-full",

        spacing === "sm" &&
          "py-4 sm:py-5",

        spacing === "default" &&
          "py-6 sm:py-8",

        spacing === "lg" &&
          "py-8 sm:py-10 lg:py-12",

        className,
      )}
      {...props}
    />
  )
}

export { ContentSection }