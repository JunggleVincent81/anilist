import { cn } from "cn"

function Skeleton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-md bg-surface-hover/70",
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }