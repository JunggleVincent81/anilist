import {
  graphqlRequest,
} from "./client"

type AchievementCategory =
  | "JOURNEY"
  | "COMPLETION"
  | "EPISODES"
  | "RATING"
  | "REWATCH"
  | "FAVORITES"
  | "GENRE"

type AchievementMetric =
  | "TRACKED_ANIME"
  | "COMPLETED_ANIME"
  | "EPISODES_LOGGED"
  | "SCORED_ANIME"
  | "REWATCHES"
  | "FAVORITE_ANIME"
  | "GENRE_ANIME"

type AchievementItem = {
  id: string
  code: string

  name: string
  description: string

  category:
    AchievementCategory

  metric:
    AchievementMetric

  threshold: number

  targetKey:
    string | null

  iconKey: string

  titleReward:
    string | null

  progress: number
  progressPercent: number

  unlocked: boolean

  unlockedAt:
    string | null

  showcasePosition:
    number | null

  canEquipTitle: boolean
}

type AchievementTitle = {
  achievementId: string
  code: string
  title: string
}

type AchievementProfile = {
  username: string

  total: number
  unlockedCount: number

  equippedTitle:
    AchievementTitle | null

  showcase:
    AchievementItem[]

  items:
    AchievementItem[]
}

type AchievementEvaluationResult = {
  evaluatedAchievements:
    number

  newlyUnlocked:
    number

  totalUnlocked:
    number
}

type UserAchievementsResponse = {
  userAchievements:
    AchievementProfile | null
}

type MyAchievementsResponse = {
  myAchievements:
    AchievementProfile | null
}

type ReconcileAchievementsResponse = {
  reconcileMyAchievements:
    AchievementEvaluationResult
}

type SetAchievementShowcaseResponse = {
  setAchievementShowcase:
    AchievementProfile
}

type EquipAchievementTitleResponse = {
  equipAchievementTitle:
    AchievementProfile
}

const ACHIEVEMENT_FIELDS = `
  username
  total
  unlockedCount

  equippedTitle {
    achievementId
    code
    title
  }

  showcase {
    id
    code

    name
    description

    category
    metric

    threshold
    targetKey

    iconKey
    titleReward

    progress
    progressPercent

    unlocked
    unlockedAt

    showcasePosition
    canEquipTitle
  }

  items {
    id
    code

    name
    description

    category
    metric

    threshold
    targetKey

    iconKey
    titleReward

    progress
    progressPercent

    unlocked
    unlockedAt

    showcasePosition
    canEquipTitle
  }
`

const USER_ACHIEVEMENTS_QUERY = `
  query UserAchievements(
    $username: String!
  ) {
    userAchievements(
      username: $username
    ) {
      ${ACHIEVEMENT_FIELDS}
    }
  }
`

const MY_ACHIEVEMENTS_QUERY = `
  query MyAchievements {
    myAchievements {
      ${ACHIEVEMENT_FIELDS}
    }
  }
`

const RECONCILE_ACHIEVEMENTS_MUTATION = `
  mutation ReconcileMyAchievements {
    reconcileMyAchievements {
      evaluatedAchievements
      newlyUnlocked
      totalUnlocked
    }
  }
`

const SET_ACHIEVEMENT_SHOWCASE_MUTATION = `
  mutation SetAchievementShowcase(
    $achievementId: ID!
    $position: Int
  ) {
    setAchievementShowcase(
      achievementId: $achievementId
      position: $position
    ) {
      ${ACHIEVEMENT_FIELDS}
    }
  }
`

const EQUIP_ACHIEVEMENT_TITLE_MUTATION = `
  mutation EquipAchievementTitle(
    $achievementId: ID
  ) {
    equipAchievementTitle(
      achievementId: $achievementId
    ) {
      ${ACHIEVEMENT_FIELDS}
    }
  }
`

async function getUserAchievements(
  username: string,
): Promise<
  AchievementProfile | null
> {
  const data =
    await graphqlRequest<
      UserAchievementsResponse,
      {
        username: string
      }
    >(
      USER_ACHIEVEMENTS_QUERY,
      {
        username,
      },
    )

  return data.userAchievements
}

async function getMyAchievements():
  Promise<
    AchievementProfile | null
  > {
  const data =
    await graphqlRequest<
      MyAchievementsResponse
    >(
      MY_ACHIEVEMENTS_QUERY,
    )

  return data.myAchievements
}

async function reconcileMyAchievements():
  Promise<
    AchievementEvaluationResult
  > {
  const data =
    await graphqlRequest<
      ReconcileAchievementsResponse
    >(
      RECONCILE_ACHIEVEMENTS_MUTATION,
    )

  return (
    data
      .reconcileMyAchievements
  )
}

async function setAchievementShowcase(
  achievementId: string,

  position:
    number | null,
): Promise<
  AchievementProfile
> {
  const data =
    await graphqlRequest<
      SetAchievementShowcaseResponse,
      {
        achievementId: string

        position:
          number | null
      }
    >(
      SET_ACHIEVEMENT_SHOWCASE_MUTATION,
      {
        achievementId,
        position,
      },
    )

  return (
    data
      .setAchievementShowcase
  )
}

async function equipAchievementTitle(
  achievementId:
    string | null,
): Promise<
  AchievementProfile
> {
  const data =
    await graphqlRequest<
      EquipAchievementTitleResponse,
      {
        achievementId:
          string | null
      }
    >(
      EQUIP_ACHIEVEMENT_TITLE_MUTATION,
      {
        achievementId,
      },
    )

  return (
    data
      .equipAchievementTitle
  )
}

export {
  equipAchievementTitle,
  getMyAchievements,
  getUserAchievements,
  reconcileMyAchievements,
  setAchievementShowcase,
}

export type {
  AchievementCategory,
  AchievementEvaluationResult,
  AchievementItem,
  AchievementMetric,
  AchievementProfile,
  AchievementTitle,
}
