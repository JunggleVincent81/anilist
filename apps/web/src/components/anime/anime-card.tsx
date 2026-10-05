import type { ReactNode } from "react"
import Link from "next/link"
import {
  ImageIcon,
  StarIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

type AnimeCardProps = {
  slug: string
  title: string
  posterUrl?: string | null
  format?: string | null
  episodes?: number | null
  year?: number | null
  score?: number | null
  action?: ReactNode
  className?: string
}

function AnimeCard({
  slug,
  title,
  posterUrl,
  format,
  episodes,
  year,
  score,
  action,
  className,
}: AnimeCardProps) {
  const metadata = [
    format,
    typeof episodes === "number"
      ? `${episodes} ep${episodes === 1 ? "" : "s"}`
      : null,
    year,
  ].filter(
    (
      value,
    ): value is string | number =>
      value !== null &&
      value !== undefined,
  )

  return (
    <article
      data-slot="anime-card"
      className={cn(
        "group relative min-w-0",
        className,
      )}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-border bg-surface shadow-sm shadow-black/10 transition-[transform,border-color,box-shadow] duration-200 group-hover:-translate-y-0.5 group-hover:border-border/90 group-hover:shadow-lg group-hover:shadow-black/20 group-focus-within:border-ring group-focus-within:ring-2 group-focus-within:ring-ring/75">
        {posterUrl ? (
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-cover bg-center transition-transform duration-200 group-hover:scale-[1.018]"
            style={{
              backgroundImage: `url(${JSON.stringify(
                posterUrl,
              )})`,
            }}
          />
        ) : (
          <div
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-surface-elevated via-surface to-background text-muted-foreground"
          >
            <ImageIcon className="size-8 opacity-50" />
          </div>
        )}

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/5 opacity-70 transition-opacity group-hover:opacity-90"
        />

        {action && (
          <div className="absolute top-2 right-2 z-20 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            {action}
          </div>
        )}

        {typeof score === "number" && (
          <div className="absolute bottom-2 left-2 z-20 inline-flex h-7 items-center gap-1 rounded-md border border-white/10 bg-black/65 px-2 text-caption font-semibold text-white backdrop-blur-md">
            <StarIcon
              aria-hidden="true"
              className="size-3 fill-warning text-warning"
            />

            <span>
              {score.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      <h3 className="mt-3 line-clamp-2 font-medium leading-5 text-foreground transition-colors">
        <Link
          href={`/anime/${slug}`}
          className="outline-none before:absolute before:inset-0 before:z-10 hover:text-primary focus-visible:text-primary"
        >
          {title}
        </Link>
      </h3>

      {metadata.length > 0 && (
        <div className="mt-1.5 flex min-w-0 items-center gap-1.5 overflow-hidden text-caption text-muted-foreground">
          {metadata.map(
            (item, index) => (
              <span
                key={`${item}-${index}`}
                className="contents"
              >
                {index > 0 && (
                  <span
                    aria-hidden="true"
                    className="text-border"
                  >
                    •
                  </span>
                )}

                <span className="truncate">
                  {item}
                </span>
              </span>
            ),
          )}
        </div>
      )}
    </article>
  )
}

export { AnimeCard }
export type { AnimeCardProps }