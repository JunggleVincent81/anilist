import {
  graphqlRequest,
} from "./client"

type UserGenreStatistic = {
  id: string
  slug: string
  name: string
  count: number
}

type UserStatistics = {
  username: string

  totalTracked: number

  planning: number
  watching: number
  completed: number
  paused: number
  dropped: number
  rewatching: number

  episodesLogged: number
  totalRewatches: number

  scoredAnime: number
  meanScore: number | null

  favoriteAnimeCount: number

  topGenres:
    UserGenreStatistic[]
}

type UserStatisticsResponse = {
  userStatistics:
    UserStatistics | null
}

const USER_STATISTICS_QUERY = `
  query UserStatistics(
    $username: String!
  ) {
    userStatistics(
      username: $username
    ) {
      username

      totalTracked

      planning
      watching
      completed
      paused
      dropped
      rewatching

      episodesLogged
      totalRewatches

      scoredAnime
      meanScore

      favoriteAnimeCount

      topGenres {
        id
        slug
        name
        count
      }
    }
  }
`

async function getUserStatistics(
  username: string,
): Promise<
  UserStatistics | null
> {
  const data =
    await graphqlRequest<
      UserStatisticsResponse,
      {
        username: string
      }
    >(
      USER_STATISTICS_QUERY,
      {
        username,
      },
    )

  return data.userStatistics
}

export {
  getUserStatistics,
}

export type {
  UserGenreStatistic,
  UserStatistics,
}
