import {
  graphqlRequest,
} from "./client"

import type {
  AnimeSummary,
} from "./anime"

type AiringScheduleItem = {
  airingAt: string
  episode: number
  anime: AnimeSummary
}

type AiringScheduleResult = {
  generatedAt: string
  rangeStart: string
  rangeEnd: string
  items: AiringScheduleItem[]
}

type AiringScheduleResponse = {
  airingSchedule:
    AiringScheduleResult
}

const AIRING_SCHEDULE_QUERY = `
  query AiringSchedule(
    $days: Int
  ) {
    airingSchedule(
      days: $days
    ) {
      generatedAt
      rangeStart
      rangeEnd

      items {
        airingAt
        episode

        anime {
          id
          slug
          title

          format
          status

          episodes

          season
          seasonYear

          coverImageUrl
        }
      }
    }
  }
`

async function getAiringSchedule(
  days = 7,
): Promise<AiringScheduleResult> {
  const data =
    await graphqlRequest<
      AiringScheduleResponse,
      {
        days: number
      }
    >(
      AIRING_SCHEDULE_QUERY,
      {
        days,
      },
    )

  return data.airingSchedule
}

export {
  getAiringSchedule,
}

export type {
  AiringScheduleItem,
  AiringScheduleResult,
}
