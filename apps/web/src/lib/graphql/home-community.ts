import { graphqlRequest } from "@/lib/graphql/client"
import type { PulsePreview, PublicReviewPreview } from "@/lib/home/community-preview-policy"

// Bounded public endpoints; no user token and no client-side mutations.
export const HOME_PULSE_QUERY = `
  query HomePublicPulse($input: ActivityFeedInput) {
    publicActivityFeed(input: $input) {
      items {
        id type text createdAt
        actor { username displayName }
        anime { slug title }
      }
    }
  }
`
export const HOME_RECENT_REVIEWS_QUERY = `
  query HomeRecentReviews {
    recentPublicAnimeReviews {
      id title body score isSpoiler createdAt
      author { username displayName }
      anime { slug title }
    }
  }
`
export async function fetchHomePulse(): Promise<PulsePreview[]> {
  const data = await graphqlRequest<{
    publicActivityFeed: { items: PulsePreview[] }
  }, { input: { page: number; perPage: number } }>(HOME_PULSE_QUERY, {
    input: { page: 1, perPage: 8 },
  })
  return data.publicActivityFeed.items
}
export async function fetchHomeRecentReviews(): Promise<PublicReviewPreview[]> {
  const data = await graphqlRequest<{
    recentPublicAnimeReviews: PublicReviewPreview[]
  }>(HOME_RECENT_REVIEWS_QUERY)
  return data.recentPublicAnimeReviews
}
