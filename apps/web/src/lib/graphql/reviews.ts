import { graphqlRequest } from "@/lib/graphql/client"
import {
  ANIME_REVIEWS_QUERY,
  CREATE_ANIME_REVIEW_MUTATION,
  DELETE_MY_ANIME_REVIEW_MUTATION,
  REVIEW_PAGE_SIZE,
  UPDATE_ANIME_REVIEW_MUTATION,
  USER_REVIEWS_QUERY,
  cleanReviewDraft,
  normalizeReviewPage,
  type ReviewDraft,
} from "./reviews.contract"

export type AnimeReview = {
  id: string
  userId: string
  animeId: string
  title: string | null
  body: string
  score: number | null
  isSpoiler: boolean
  createdAt: string
  updatedAt: string
  author: { id: string; username: string; displayName: string | null; avatarUrl: string | null }
}
export type AnimeReviewPage = {
  items: AnimeReview[]
  pageInfo: {
    page: number
    perPage: number
    total: number
    pageCount: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}
export type AnimeReviewStats = {
  animeId: string
  totalReviews: number
  scoredReviews: number
  averageScore: number | null
}

export async function fetchAnimeReviews(animeId: string, page: number): Promise<{
  reviews: AnimeReviewPage
  stats: AnimeReviewStats
}> {
  const response = await graphqlRequest<{
    animeReviews: AnimeReviewPage
    animeReviewStats: AnimeReviewStats
  }, { animeId: string; input: { page: number; perPage: number } }>(ANIME_REVIEWS_QUERY, {
    animeId, input: { page: normalizeReviewPage(page), perPage: REVIEW_PAGE_SIZE },
  })
  return { reviews: response.animeReviews, stats: response.animeReviewStats }
}

/** Backend allows exactly one review per user/anime; search user's reviews for edit availability. */
export async function findOwnAnimeReview(username: string, animeId: string): Promise<AnimeReview | null> {
  // Bounded pagination avoids unlimited requests for unusually prolific users.
  for (let page = 1; page <= 10; page += 1) {
    const result = await graphqlRequest<{
      userReviews: AnimeReviewPage | null
    }, { username: string; input: { page: number; perPage: number } }>(USER_REVIEWS_QUERY, {
      username, input: { page, perPage: 100 },
    })
    const feed = result.userReviews
    if (!feed) return null
    const mine = feed.items.find((review) => review.animeId === animeId)
    if (mine) return mine
    if (!feed.pageInfo.hasNextPage) return null
  }
  return null
}

export async function createAnimeReview(animeId: string, input: ReviewDraft): Promise<void> {
  await graphqlRequest(CREATE_ANIME_REVIEW_MUTATION, {
    input: { animeId, ...cleanReviewDraft(input) },
  })
}
export async function updateAnimeReview(id: string, input: ReviewDraft): Promise<void> {
  await graphqlRequest(UPDATE_ANIME_REVIEW_MUTATION, {
    input: { id, ...cleanReviewDraft(input) },
  })
}
export async function deleteMyAnimeReview(id: string): Promise<boolean> {
  const result = await graphqlRequest<{ deleteMyAnimeReview: boolean }, { id: string }>(
    DELETE_MY_ANIME_REVIEW_MUTATION, { id },
  )
  return result.deleteMyAnimeReview
}
