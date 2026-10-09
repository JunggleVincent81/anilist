import { graphqlRequest } from "@/lib/graphql/client"
import {
  ACTIVITY_REPLIES_QUERY,
  CREATE_ACTIVITY_MUTATION,
  CREATE_ACTIVITY_REPLY_MUTATION,
  FEED_PAGE_SIZE,
  FOLLOWING_ACTIVITY_FEED_QUERY,
  LIKE_ACTIVITY_MUTATION,
  PUBLIC_ACTIVITY_FEED_QUERY,
  UNLIKE_ACTIVITY_MUTATION,
  cleanActivityText,
  normalizeFeedPage,
  type ActivityFeedScope,
} from "./activity-feed.contract"

export type Activity = {
  id: string
  type: string
  text: string | null
  animeStatus: string | null
  progressEpisodes: number | null
  createdAt: string
  likeCount: number
  replyCount: number
  actor: { username: string; displayName: string | null }
  anime: { slug: string; title: string } | null
  achievement: { name: string } | null
}

export type ActivityPage = {
  items: Activity[]
  pageInfo: {
    page: number
    perPage: number
    total: number
    pageCount: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export type ActivityReply = {
  id: string
  body: string
  createdAt: string
  author: { username: string; displayName: string | null }
}

export async function fetchActivityFeed(scope: ActivityFeedScope, page: number): Promise<ActivityPage> {
  const key = scope === "public" ? "publicActivityFeed" : "followingActivityFeed"
  const query = scope === "public" ? PUBLIC_ACTIVITY_FEED_QUERY : FOLLOWING_ACTIVITY_FEED_QUERY
  const response = await graphqlRequest<Record<typeof key, ActivityPage>, { input: { page: number; perPage: number } }>(
    query,
    { input: { page: normalizeFeedPage(page), perPage: FEED_PAGE_SIZE } },
  )
  return response[key]
}

export async function postTextActivity(text: string): Promise<void> {
  await graphqlRequest(CREATE_ACTIVITY_MUTATION, { input: { text: cleanActivityText(text) } })
}

export async function setActivityLike(activityId: string, liked: boolean): Promise<void> {
  const query = liked ? LIKE_ACTIVITY_MUTATION : UNLIKE_ACTIVITY_MUTATION
  await graphqlRequest(query, { activityId })
}

export async function fetchActivityReplies(activityId: string): Promise<ActivityReply[]> {
  const response = await graphqlRequest<{
    activityReplies: { items: ActivityReply[] } | null
  }, { activityId: string; input: { page: number; perPage: number } }>(ACTIVITY_REPLIES_QUERY, { activityId, input: { page: 1, perPage: 20 } })
  return response.activityReplies?.items ?? []
}

export async function postActivityReply(activityId: string, text: string): Promise<void> {
  await graphqlRequest(CREATE_ACTIVITY_REPLY_MUTATION, {
    activityId,
    input: { body: cleanActivityText(text) },
  })
}
