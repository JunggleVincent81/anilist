import { LoaderCircleIcon } from "lucide-react"
import { cn } from "cn"

type LoadingStateProps = {
  message?: string
  className?: string
}

function LoadingState({
  message = "Loading…",
  className,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex min-h-48 flex-col items-center justify-center gap-3 px-6 py-10 text-center",
        className,
      )}
    >
      <LoaderCircleIcon
        aria-hidden="true"
        className="size-5 animate-spin text-primary"
      />

      <p className="text-small text-muted-foreground">
        {message}
      </p>
    </div>
  )
}

export { LoadingState }