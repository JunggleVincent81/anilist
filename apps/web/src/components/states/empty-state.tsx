import type { ReactNode } from "react"
import { InboxIcon } from "lucide-react"
import { cn } from "cn"

type EmptyStateProps = {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center",
        className,
      )}
    >
      <div className="flex size-11 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground">
        {icon ?? (
          <InboxIcon
            aria-hidden="true"
            className="size-5"
          />
        )}
      </div>

      <h3 className="mt-4 text-h3">
        {title}
      </h3>

      {description && (
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-5">
          {action}
        </div>
      )}
    </div>
  )
}

export { EmptyState }