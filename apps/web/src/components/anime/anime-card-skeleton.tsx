import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type AnimeCardSkeletonProps = {
  className?: string
}

function AnimeCardSkeleton({
  className,
}: AnimeCardSkeletonProps) {
  return (
    <div
      data-slot="anime-card-skeleton"
      aria-hidden="true"
      className={cn(
        "min-w-0",
        className,
      )}
    >
      <Skeleton className="aspect-[2/3] w-full rounded-lg" />

      <div className="mt-3 space-y-2">
        <Skeleton className="h-4 w-[88%]" />
        <Skeleton className="h-4 w-[62%]" />

        <Skeleton className="mt-2 h-3 w-[48%]" />
      </div>
    </div>
  )
}

export { AnimeCardSkeleton }