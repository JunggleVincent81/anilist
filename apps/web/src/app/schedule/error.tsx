"use client"

import {
  Button,
} from "@/components/ui/button"

type ScheduleErrorProps = {
  error: Error
  reset: () => void
}

export default function ScheduleError({
  error,
  reset,
}: ScheduleErrorProps) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md rounded-2xl border border-destructive/25 bg-destructive/5 p-6 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-destructive">
          Schedule
        </p>

        <h1 className="mt-3 text-2xl font-semibold">
          Unable to load schedule
        </h1>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {error.message ||
            "Upcoming episode data is temporarily unavailable."}
        </p>

        <Button
          type="button"
          variant="outline"
          className="mt-5"
          onClick={
            reset
          }
        >
          Try again
        </Button>
      </div>
    </main>
  )
}
