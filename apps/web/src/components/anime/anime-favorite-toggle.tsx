"use client"

import {
  useEffect,
  useState,
} from "react"
import Link from "next/link"
import {
  HeartIcon,
  LoaderCircleIcon,
} from "lucide-react"
import {
  toast,
} from "sonner"

import {
  Button,
} from "@/components/ui/button"
import {
  GraphQLRequestError,
} from "@/lib/graphql/client"
import {
  addAnimeFavorite,
  getMyAnimeFavorite,
  removeAnimeFavorite,
} from "@/lib/graphql/favorites"

import type {
  AnimeFavorite,
} from "@/lib/graphql/favorites"

type AnimeFavoriteToggleProps = {
  animeId: string
}

type LoadState =
  | "loading"
  | "guest"
  | "ready"
  | "error"

export function AnimeFavoriteToggle({
  animeId,
}: AnimeFavoriteToggleProps) {
  const [
    favorite,
    setFavorite,
  ] =
    useState<
      AnimeFavorite | null
    >(null)

  const [
    loadState,
    setLoadState,
  ] =
    useState<LoadState>(
      "loading",
    )

  const [
    saving,
    setSaving,
  ] =
    useState(false)

  const [
    reloadKey,
    setReloadKey,
  ] =
    useState(0)

  useEffect(
    () => {
      let active = true

      async function loadFavorite() {
        try {
          const result =
            await getMyAnimeFavorite(
              animeId,
            )

          if (!active) {
            return
          }

          setFavorite(
            result,
          )

          setLoadState(
            "ready",
          )
        } catch (error) {
          if (!active) {
            return
          }

          if (
            error instanceof
              GraphQLRequestError &&
            error.code ===
              "UNAUTHENTICATED"
          ) {
            setFavorite(
              null,
            )

            setLoadState(
              "guest",
            )

            return
          }

          setLoadState(
            "error",
          )
        }
      }

      void loadFavorite()

      return () => {
        active = false
      }
    },
    [
      animeId,
      reloadKey,
    ],
  )

  async function toggleFavorite() {
    if (saving) {
      return
    }

    setSaving(true)

    try {
      if (favorite) {
        await removeAnimeFavorite(
          animeId,
        )

        setFavorite(
          null,
        )

        toast.success(
          "Removed from Favorites.",
        )
      } else {
        const result =
          await addAnimeFavorite(
            animeId,
          )

        setFavorite(
          result,
        )

        toast.success(
          "Added to Favorites.",
        )
      }
    } catch (error) {
      if (
        error instanceof
          GraphQLRequestError
      ) {
        if (
          error.code ===
          "UNAUTHENTICATED"
        ) {
          setLoadState(
            "guest",
          )

          toast.error(
            "Sign in to favorite anime.",
          )

          return
        }

        toast.error(
          error.message,
        )

        return
      }

      toast.error(
        "Unable to update Favorites.",
      )
    } finally {
      setSaving(false)
    }
  }

  if (
    loadState ===
    "loading"
  ) {
    return (
      <Button
        variant="outline"
        className="w-full"
        disabled
      >
        <LoaderCircleIcon className="animate-spin" />
        Loading favorite
      </Button>
    )
  }

  if (
    loadState ===
    "guest"
  ) {
    return (
      <Button
        nativeButton={false}
        variant="outline"
        className="w-full"
        render={
          <Link href="/login" />
        }
      >
        <HeartIcon />
        Sign in to favorite
      </Button>
    )
  }

  if (
    loadState ===
    "error"
  ) {
    return (
      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setLoadState(
            "loading",
          )

          setReloadKey(
            (value) =>
              value + 1,
          )
        }}
      >
        Try loading Favorites again
      </Button>
    )
  }

  return (
    <Button
      variant={
        favorite
          ? "secondary"
          : "outline"
      }
      className="w-full"
      aria-pressed={
        Boolean(
          favorite,
        )
      }
      disabled={saving}
      onClick={() => {
        void toggleFavorite()
      }}
    >
      {saving ? (
        <LoaderCircleIcon className="animate-spin" />
      ) : (
        <HeartIcon
          className={
            favorite
              ? "fill-current"
              : undefined
          }
        />
      )}

      {saving
        ? "Saving..."
        : favorite
          ? "Favorited"
          : "Add to Favorites"}
    </Button>
  )
}
