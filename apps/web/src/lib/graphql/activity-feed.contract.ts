/** AN-127: source of truth for social-feed GraphQL operations and input limits. */
export const FEED_PAGE_SIZE = 10
export const MAX_ACTIVITY_TEXT = 500

export type ActivityFeedScope = "public" | "following"

export function cleanActivityText(value: string): string {
  const text = value.trim()
  if (text.length === 0 || text.length > MAX_ACTIVITY_TEXT) {
    throw new Error(`Write between 1 and ${MAX_ACTIVITY_TEXT} characters.`)
  }
  return text
}

export function normalizeFeedPage(page: number): number {
  return Number.isSafeInteger(page) && page > 0 ? page : 1
}

const activityFields = `
  items {
    id type text animeStatus progressEpisodes createdAt likeCount replyCount
    actor { username displayName }
    anime { slug title }
    achievement { name }
  }
  pageInfo { page perPage total pageCount hasNextPage hasPreviousPage }
`

export const PUBLIC_ACTIVITY_FEED_QUERY = `
  query PublicActivityFeed($input: ActivityFeedInput) {
    publicActivityFeed(input: $input) { ${activityFields} }
  }
`

export const FOLLOWING_ACTIVITY_FEED_QUERY = `
  query FollowingActivityFeed($input: ActivityFeedInput) {
    followingActivityFeed(input: $input) { ${activityFields} }
  }
`

export const CREATE_ACTIVITY_MUTATION = `
  mutation CreateTextActivity($input: CreateTextActivityInput!) {
    createTextActivity(input: $input) { id }
  }
`

export const LIKE_ACTIVITY_MUTATION = `
  mutation LikeActivity($activityId: ID!) { likeActivity(activityId: $activityId) }
`

export const UNLIKE_ACTIVITY_MUTATION = `
  mutation UnlikeActivity($activityId: ID!) { unlikeActivity(activityId: $activityId) }
`

export const ACTIVITY_REPLIES_QUERY = `
  query ActivityReplies($activityId: ID!, $input: ActivityFeedInput) {
    activityReplies(activityId: $activityId, input: $input) {
      items { id body createdAt author { username displayName } }
      pageInfo { hasNextPage }
    }
  }
`

export const CREATE_ACTIVITY_REPLY_MUTATION = `
  mutation CreateActivityReply($activityId: ID!, $input: CreateActivityReplyInput!) {
    createActivityReply(activityId: $activityId, input: $input) { id }
  }
`
