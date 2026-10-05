import { TriangleAlertIcon } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"

type ErrorStateProps = {
  title?: string
  description?: string
  retryLabel?: string
  onRetry?: () => void
  className?: string
}

function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this content.",
  retryLabel = "Try again",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center",
        className,
      )}
    >
      <div className="flex size-11 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10 text-destructive">
        <TriangleAlertIcon
          aria-hidden="true"
          className="size-5"
        />
      </div>

      <h3 className="mt-4 text-h3">
        {title}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>

      {onRetry && (
        <Button
          variant="outline"
          className="mt-5"
          onClick={onRetry}
        >
          {retryLabel}
        </Button>
      )}
    </div>
  )
}

export { ErrorState }