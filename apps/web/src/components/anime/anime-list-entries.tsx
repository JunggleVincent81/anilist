"use client"

import {
  useEffect,
  useState,
} from "react"
import {
  useRouter,
} from "next/navigation"

import {
  AnimeListEntryCard,
} from "@/components/anime/anime-list-entry-card"
import {
  AnimeListEntryEditor,
} from "@/components/anime/anime-list-entry-editor"
import {
  getCurrentUser,
} from "@/lib/graphql/auth"

import type {
  AnimeListEntry,
} from "@/lib/graphql/tracking"

type AnimeListEntriesProps = {
  username: string
  initialEntries:
    AnimeListEntry[]
}

function AnimeListEntries({
  username,
  initialEntries,
}: AnimeListEntriesProps) {
  const router =
    useRouter()

  const [
    entries,
    setEntries,
  ] =
    useState(
      initialEntries,
    )

  const [
    owner,
    setOwner,
  ] =
    useState(false)

  useEffect(
    () => {
      let active = true

      async function loadOwner() {
        try {
          const user =
            await getCurrentUser()

          if (!active) {
            return
          }

          setOwner(
            user?.username
              .toLowerCase() ===
              username.toLowerCase(),
          )
        } catch {
          if (active) {
            setOwner(false)
          }
        }
      }

      void loadOwner()

      return () => {
        active = false
      }
    },
    [username],
  )

  function updateEntry(
    updated:
      AnimeListEntry,
  ) {
    setEntries(
      (current) =>
        current.map(
          (entry) =>
            entry.id ===
            updated.id
              ? updated
              : entry,
        ),
    )

    router.refresh()
  }

  return (
    <div className="space-y-3">
      {entries.map(
        (entry) => (
          <div
            key={entry.id}
            className="space-y-2"
          >
            <AnimeListEntryCard
              entry={entry}
            />

            {owner ? (
              <div className="flex justify-end">
                <AnimeListEntryEditor
                  entry={entry}
                  onUpdated={
                    updateEntry
                  }
                />
              </div>
            ) : null}
          </div>
        ),
      )}
    </div>
  )
}

export {
  AnimeListEntries,
}
