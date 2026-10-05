import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

type PageContainerProps =
  ComponentProps<"div"> & {
    size?: "default" | "narrow" | "wide"
  }

function PageContainer({
  className,
  size = "default",
  ...props
}: PageContainerProps) {
  return (
    <div
      data-slot="page-container"
      data-size={size}
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",

        size === "default" &&
          "max-w-[1440px]",

        size === "narrow" &&
          "max-w-5xl",

        size === "wide" &&
          "max-w-[1600px]",

        className,
      )}
      {...props}
    />
  )
}

export { PageContainer }