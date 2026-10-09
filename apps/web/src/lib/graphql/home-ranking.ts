import { graphqlRequest } from "@/lib/graphql/client"

export type CommunityRankedAnime = {
  slug: string
  title: string
  averageScore: number
  weightedScore: number
  scoredReviewCount: number
}

export const HOME_COMMUNITY_RANKING_QUERY = `query HomeCommunityRanking {
  communityRankedAnime { slug title averageScore weightedScore scoredReviewCount }
}`

export async function fetchHomeCommunityRanking(): Promise<CommunityRankedAnime[]> {
  const result = await graphqlRequest<{ communityRankedAnime: CommunityRankedAnime[] }>(HOME_COMMUNITY_RANKING_QUERY)
  return result.communityRankedAnime
}
