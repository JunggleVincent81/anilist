import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type SectionHeaderProps = {
  title: string
  description?: string
  eyebrow?: string
  action?: ReactNode
  className?: string
}

function SectionHeader({
  title,
  description,
  eyebrow,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div
      data-slot="section-header"
      className={cn(
        "mb-5 flex items-end justify-between gap-4 sm:mb-6",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-caption font-semibold uppercase tracking-[0.16em] text-brand-accent">
            {eyebrow}
          </p>
        )}

        <h2 className="text-h2">
          {title}
        </h2>

        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="shrink-0">
          {action}
        </div>
      )}
    </div>
  )
}

export { SectionHeader }