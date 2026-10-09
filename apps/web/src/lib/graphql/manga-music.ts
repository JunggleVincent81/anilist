import { graphqlRequest } from "@/lib/graphql/client"

export type MangaPreview = {
  id: string
  slug: string
  title: string
  synopsis: string | null
  sourceName: string
  sourceReference: string
}

export type AnimeMusicPreview = {
  id: string
  slug: string
  title: string
  artistName: string
  category: string
  animeSlug: string | null
  sourceName: string
  sourceReference: string
}

export const MANGA_PREVIEW_QUERY = `query PublicMangaPreview {
  publicMangaPreview { id slug title synopsis sourceName sourceReference }
}`
export const MUSIC_PREVIEW_QUERY = `query PublicAnimeMusicPreview {
  publicAnimeMusicPreview { id slug title artistName category animeSlug sourceName sourceReference }
}`

export async function getPublicMangaPreview(): Promise<MangaPreview[]> {
  const response = await graphqlRequest<{ publicMangaPreview: MangaPreview[] }>(MANGA_PREVIEW_QUERY)
  return response.publicMangaPreview
}

export async function getPublicAnimeMusicPreview(): Promise<AnimeMusicPreview[]> {
  const response = await graphqlRequest<{ publicAnimeMusicPreview: AnimeMusicPreview[] }>(MUSIC_PREVIEW_QUERY)
  return response.publicAnimeMusicPreview
}
