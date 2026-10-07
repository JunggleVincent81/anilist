"use client"

import {
  useEffect,
} from "react"

import {
  Button,
} from "@/components/ui/button"

type DiscoverErrorProps = {
  error:
    Error & {
      digest?:
        string
    }

  reset:
    () => void
}

function DiscoverError({
  error,
  reset,
}: DiscoverErrorProps) {
  useEffect(
    () => {
      console.error(
        error,
      )
    },
    [
      error,
    ],
  )

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md rounded-xl border border-destructive/25 bg-destructive/5 p-6 text-center">
        <h1 className="font-heading text-lg font-semibold">
          Unable to load anime
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          The discovery service could not be reached. Check the API and database, then try again.
        </p>

        <Button
          type="button"
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

export default DiscoverError