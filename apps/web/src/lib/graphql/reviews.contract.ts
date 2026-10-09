/** AN-129. Use GraphQL variables for all user values; never interpolate input into GraphQL source. */
export const REVIEW_PAGE_SIZE = 10
export const REVIEW_BODY_LIMIT = 10_000
export const REVIEW_TITLE_LIMIT = 150
export const REVIEW_SCORE_CHOICES = Array.from({ length: 19 }, (_, index) => 1 + index * 0.5)

export type ReviewDraft = { title: string; body: string; score: number | null; isSpoiler: boolean }
export type CleanReviewDraft = { title: string | null; body: string; score: number | null; isSpoiler: boolean }

export function cleanReviewDraft(input: ReviewDraft): CleanReviewDraft {
  const title = input.title.trim()
  const body = input.body.trim()
  if (title.length > REVIEW_TITLE_LIMIT) throw new Error(`Title must be at most ${REVIEW_TITLE_LIMIT} characters.`)
  if (body.length < 1 || body.length > REVIEW_BODY_LIMIT) throw new Error(`Review must be between 1 and ${REVIEW_BODY_LIMIT} characters.`)
  if (input.score !== null && (
    !Number.isFinite(input.score) || input.score < 1 || input.score > 10 || !Number.isInteger(input.score * 2)
  )) throw new Error('Rating must be between 1 and 10 in 0.5 steps.')
  return { title: title || null, body, score: input.score, isSpoiler: input.isSpoiler }
}
export function normalizeReviewPage(value: number): number {
  return Number.isSafeInteger(value) && value > 0 ? value : 1
}
export function reviewScoreLabel(score: number | null): string {
  return score === null ? 'Not rated' : `${score.toFixed(1)} / 10`
}

export const ANIME_REVIEWS_QUERY = `
  query AnimeReviews($animeId: ID!, $input: ReviewFeedInput) {
    animeReviews(animeId: $animeId, input: $input) {
      items {
        id userId animeId title body score isSpoiler createdAt updatedAt
        author { id username displayName avatarUrl }
      }
      pageInfo { page perPage total pageCount hasNextPage hasPreviousPage }
    }
    animeReviewStats(animeId: $animeId) {
      animeId totalReviews scoredReviews averageScore
    }
  }
`
export const USER_REVIEWS_QUERY = `
  query UserReviews($username: String!, $input: ReviewFeedInput) {
    userReviews(username: $username, input: $input) {
      items { id userId animeId title body score isSpoiler createdAt updatedAt author { id username displayName avatarUrl } }
      pageInfo { page perPage total pageCount hasNextPage hasPreviousPage }
    }
  }
`
export const CREATE_ANIME_REVIEW_MUTATION = `
  mutation CreateAnimeReview($input: CreateAnimeReviewInput!) {
    createAnimeReview(input: $input) { id userId animeId }
  }
`
export const UPDATE_ANIME_REVIEW_MUTATION = `
  mutation UpdateAnimeReview($input: UpdateAnimeReviewInput!) {
    updateAnimeReview(input: $input) { id userId animeId }
  }
`
export const DELETE_MY_ANIME_REVIEW_MUTATION = `
  mutation DeleteMyAnimeReview($id: ID!) { deleteMyAnimeReview(id: $id) }
`
