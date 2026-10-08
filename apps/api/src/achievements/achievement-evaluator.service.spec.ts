import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  AchievementMetric,
  AnimeListStatus,
} from '@prisma/client';

import type {
  PrismaService,
} from '../database/prisma.service.js';

import {
  AchievementEvaluatorService,
} from './achievement-evaluator.service.js';

function createService({
  achievements,
  entries,
  favoriteAnimeCount = 0,
  existingUnlocks = [],
  createdCount = 0,
  totalUnlocked = 0,
}: {
  achievements:
    Array<{
      id: string;
      metric:
        AchievementMetric;
      threshold: number;
      targetKey:
        string | null;
    }>;

  entries:
    Array<{
      status:
        AnimeListStatus;

      progressEpisodes:
        number;

      score:
        unknown | null;

      rewatchCount:
        number;

      anime: {
        genres:
          Array<{
            genre: {
              slug: string;
            };
          }>;
      };
    }>;

  favoriteAnimeCount?:
    number;

  existingUnlocks?:
    Array<{
      achievementId:
        string;
    }>;

  createdCount?:
    number;

  totalUnlocked?:
    number;
}) {
  const achievementFindMany =
    jest.fn(
      async (
        _args: unknown,
      ) =>
        achievements,
    );

  const entryFindMany =
    jest.fn(
      async (
        _args: unknown,
      ) =>
        entries,
    );

  const favoriteCount =
    jest.fn(
      async (
        _args: unknown,
      ) =>
        favoriteAnimeCount,
    );

  const unlockFindMany =
    jest.fn(
      async (
        _args: unknown,
      ) =>
        existingUnlocks,
    );

  const unlockCreateMany =
    jest.fn(
      async (
        _args: unknown,
      ) => ({
        count:
          createdCount,
      }),
    );

  const unlockCount =
    jest.fn(
      async (
        _args: unknown,
      ) =>
        totalUnlocked,
    );

  const prisma = {
    achievement: {
      findMany:
        achievementFindMany,
    },

    animeListEntry: {
      findMany:
        entryFindMany,
    },

    animeFavorite: {
      count:
        favoriteCount,
    },

    userAchievement: {
      findMany:
        unlockFindMany,

      createMany:
        unlockCreateMany,

      count:
        unlockCount,
    },
  } as unknown as
    PrismaService;

  return {
    service:
      new AchievementEvaluatorService(
        prisma,
      ),

    unlockCreateMany,
  };
}

describe(
  'AchievementEvaluatorService',
  () => {
    it(
      'unlocks every newly qualified achievement',
      async () => {
        const {
          service,
          unlockCreateMany,
        } =
          createService({
            achievements: [
              {
                id: 'tracked',
                metric:
                  AchievementMetric
                    .TRACKED_ANIME,
                threshold: 1,
                targetKey: null,
              },
              {
                id: 'completed',
                metric:
                  AchievementMetric
                    .COMPLETED_ANIME,
                threshold: 1,
                targetKey: null,
              },
              {
                id: 'episodes',
                metric:
                  AchievementMetric
                    .EPISODES_LOGGED,
                threshold: 100,
                targetKey: null,
              },
            ],

            entries: [
              {
                status:
                  AnimeListStatus
                    .COMPLETED,

                progressEpisodes:
                  12,

                score: null,

                rewatchCount: 0,

                anime: {
                  genres: [],
                },
              },
            ],

            createdCount: 2,
            totalUnlocked: 2,
          });

        const result =
          await service
            .evaluateUser(
              'user-1',
            );

        expect(
          result,
        ).toEqual({
          evaluatedAchievements:
            3,

          newlyUnlocked:
            2,

          totalUnlocked:
            2,
        });

        expect(
          unlockCreateMany,
        ).toHaveBeenCalledWith({
          data: [
            {
              userId:
                'user-1',

              achievementId:
                'tracked',
            },
            {
              userId:
                'user-1',

              achievementId:
                'completed',
            },
          ],

          skipDuplicates:
            true,
        });
      },
    );

    it(
      'does not recreate existing unlocks',
      async () => {
        const {
          service,
          unlockCreateMany,
        } =
          createService({
            achievements: [
              {
                id: 'tracked',
                metric:
                  AchievementMetric
                    .TRACKED_ANIME,
                threshold: 1,
                targetKey: null,
              },
            ],

            entries: [
              {
                status:
                  AnimeListStatus
                    .WATCHING,

                progressEpisodes:
                  1,

                score: null,

                rewatchCount: 0,

                anime: {
                  genres: [],
                },
              },
            ],

            existingUnlocks: [
              {
                achievementId:
                  'tracked',
              },
            ],

            totalUnlocked: 1,
          });

        const result =
          await service
            .evaluateUser(
              'user-1',
            );

        expect(
          result.newlyUnlocked,
        ).toBe(0);

        expect(
          unlockCreateMany,
        ).not
          .toHaveBeenCalled();
      },
    );

    it(
      'supports genre-specific metrics',
      async () => {
        const {
          service,
          unlockCreateMany,
        } =
          createService({
            achievements: [
              {
                id:
                  'action-fan',

                metric:
                  AchievementMetric
                    .GENRE_ANIME,

                threshold: 2,

                targetKey:
                  'action',
              },
            ],

            entries: [
              {
                status:
                  AnimeListStatus
                    .WATCHING,

                progressEpisodes:
                  1,

                score: null,

                rewatchCount: 0,

                anime: {
                  genres: [
                    {
                      genre: {
                        slug:
                          'action',
                      },
                    },
                  ],
                },
              },
              {
                status:
                  AnimeListStatus
                    .COMPLETED,

                progressEpisodes:
                  12,

                score: null,

                rewatchCount: 0,

                anime: {
                  genres: [
                    {
                      genre: {
                        slug:
                          'action',
                      },
                    },
                  ],
                },
              },
            ],

            createdCount: 1,
            totalUnlocked: 1,
          });

        await service
          .evaluateUser(
            'user-1',
          );

        expect(
          unlockCreateMany,
        ).toHaveBeenCalledWith({
          data: [
            {
              userId:
                'user-1',

              achievementId:
                'action-fan',
            },
          ],

          skipDuplicates:
            true,
        });
      },
    );
  },
);
