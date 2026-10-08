import {
  AchievementCategory,
  AchievementMetric,
} from '@prisma/client';

type AchievementDefinition = {
  code: string;
  name: string;
  description: string;

  category:
    AchievementCategory;

  metric:
    AchievementMetric;

  threshold: number;

  targetKey:
    string | null;

  iconKey: string;

  titleReward:
    string | null;

  sortOrder: number;
};

const ACHIEVEMENT_CATALOG =
  [
    {
      code: 'FIRST_STEP',
      name: 'First Step',
      description:
        'Add your first anime to your list.',
      category:
        AchievementCategory.JOURNEY,
      metric:
        AchievementMetric.TRACKED_ANIME,
      threshold: 1,
      targetKey: null,
      iconKey: 'list-plus',
      titleReward: null,
      sortOrder: 10,
    },
    {
      code: 'ON_THE_LIST',
      name: 'On the List',
      description:
        'Track 10 anime.',
      category:
        AchievementCategory.JOURNEY,
      metric:
        AchievementMetric.TRACKED_ANIME,
      threshold: 10,
      targetKey: null,
      iconKey: 'list-checks',
      titleReward: null,
      sortOrder: 20,
    },
    {
      code: 'COLLECTOR',
      name: 'Collector',
      description:
        'Track 50 anime.',
      category:
        AchievementCategory.JOURNEY,
      metric:
        AchievementMetric.TRACKED_ANIME,
      threshold: 50,
      targetKey: null,
      iconKey: 'library-big',
      titleReward: null,
      sortOrder: 30,
    },
    {
      code: 'ARCHIVIST',
      name: 'Archivist',
      description:
        'Track 100 anime.',
      category:
        AchievementCategory.JOURNEY,
      metric:
        AchievementMetric.TRACKED_ANIME,
      threshold: 100,
      targetKey: null,
      iconKey: 'archive',
      titleReward: 'Archivist',
      sortOrder: 40,
    },

    {
      code: 'FIRST_FINISH',
      name: 'First Finish',
      description:
        'Complete your first anime.',
      category:
        AchievementCategory.COMPLETION,
      metric:
        AchievementMetric.COMPLETED_ANIME,
      threshold: 1,
      targetKey: null,
      iconKey: 'circle-check',
      titleReward: null,
      sortOrder: 110,
    },
    {
      code: 'SEASONED_VIEWER',
      name: 'Seasoned Viewer',
      description:
        'Complete 10 anime.',
      category:
        AchievementCategory.COMPLETION,
      metric:
        AchievementMetric.COMPLETED_ANIME,
      threshold: 10,
      targetKey: null,
      iconKey: 'badge-check',
      titleReward: null,
      sortOrder: 120,
    },
    {
      code: 'DEDICATED_VIEWER',
      name: 'Dedicated Viewer',
      description:
        'Complete 50 anime.',
      category:
        AchievementCategory.COMPLETION,
      metric:
        AchievementMetric.COMPLETED_ANIME,
      threshold: 50,
      targetKey: null,
      iconKey: 'medal',
      titleReward:
        'Dedicated Viewer',
      sortOrder: 130,
    },
    {
      code: 'CENTURY_CLUB',
      name: 'Century Club',
      description:
        'Complete 100 anime.',
      category:
        AchievementCategory.COMPLETION,
      metric:
        AchievementMetric.COMPLETED_ANIME,
      threshold: 100,
      targetKey: null,
      iconKey: 'trophy',
      titleReward:
        'Century Viewer',
      sortOrder: 140,
    },

    {
      code: 'HUNDRED_EPISODES',
      name: 'Hundred Episodes',
      description:
        'Log 100 watched episodes.',
      category:
        AchievementCategory.EPISODES,
      metric:
        AchievementMetric.EPISODES_LOGGED,
      threshold: 100,
      targetKey: null,
      iconKey: 'play',
      titleReward: null,
      sortOrder: 210,
    },
    {
      code: 'LONG_JOURNEY',
      name: 'Long Journey',
      description:
        'Log 500 watched episodes.',
      category:
        AchievementCategory.EPISODES,
      metric:
        AchievementMetric.EPISODES_LOGGED,
      threshold: 500,
      targetKey: null,
      iconKey: 'clapperboard',
      titleReward: null,
      sortOrder: 220,
    },
    {
      code: 'THOUSAND_EPISODES',
      name: 'Thousand Episode Journey',
      description:
        'Log 1,000 watched episodes.',
      category:
        AchievementCategory.EPISODES,
      metric:
        AchievementMetric.EPISODES_LOGGED,
      threshold: 1000,
      targetKey: null,
      iconKey: 'route',
      titleReward:
        'Episode Voyager',
      sortOrder: 230,
    },

    {
      code: 'FIRST_RATING',
      name: 'First Rating',
      description:
        'Give your first anime score.',
      category:
        AchievementCategory.RATING,
      metric:
        AchievementMetric.SCORED_ANIME,
      threshold: 1,
      targetKey: null,
      iconKey: 'star',
      titleReward: null,
      sortOrder: 310,
    },
    {
      code: 'CRITIC_IN_TRAINING',
      name: 'Critic in Training',
      description:
        'Score 25 anime.',
      category:
        AchievementCategory.RATING,
      metric:
        AchievementMetric.SCORED_ANIME,
      threshold: 25,
      targetKey: null,
      iconKey: 'scan-search',
      titleReward: 'Critic',
      sortOrder: 320,
    },

    {
      code: 'ENCORE',
      name: 'Encore',
      description:
        'Complete your first rewatch.',
      category:
        AchievementCategory.REWATCH,
      metric:
        AchievementMetric.REWATCHES,
      threshold: 1,
      targetKey: null,
      iconKey: 'rotate-ccw',
      titleReward: null,
      sortOrder: 410,
    },
    {
      code: 'AGAIN_AND_AGAIN',
      name: 'Again and Again',
      description:
        'Complete 10 rewatches.',
      category:
        AchievementCategory.REWATCH,
      metric:
        AchievementMetric.REWATCHES,
      threshold: 10,
      targetKey: null,
      iconKey: 'refresh-cw',
      titleReward: 'Rewatcher',
      sortOrder: 420,
    },

    {
      code: 'CURATOR',
      name: 'Curator',
      description:
        'Favorite 5 anime.',
      category:
        AchievementCategory.FAVORITES,
      metric:
        AchievementMetric.FAVORITE_ANIME,
      threshold: 5,
      targetKey: null,
      iconKey: 'heart',
      titleReward: null,
      sortOrder: 510,
    },
    {
      code: 'PERSONAL_SHELF',
      name: 'Personal Shelf',
      description:
        'Favorite 20 anime.',
      category:
        AchievementCategory.FAVORITES,
      metric:
        AchievementMetric.FAVORITE_ANIME,
      threshold: 20,
      targetKey: null,
      iconKey: 'book-heart',
      titleReward: 'Curator',
      sortOrder: 520,
    },
  ] satisfies
    readonly AchievementDefinition[];

export {
  ACHIEVEMENT_CATALOG,
};

export type {
  AchievementDefinition,
};
