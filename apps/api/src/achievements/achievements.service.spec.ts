import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  AchievementCategory,
  AchievementMetric,
} from '@prisma/client';

import type {
  PrismaService,
} from '../database/prisma.service.js';

import type {
  AchievementEvaluatorService,
  AchievementMetricsSnapshot,
} from './achievement-evaluator.service.js';

import {
  AchievementValidationError,
} from './achievements.errors.js';

import {
  AchievementsService,
} from './achievements.service.js';

const metrics:
  AchievementMetricsSnapshot = {
    trackedAnime: 1,
    completedAnime: 1,
    episodesLogged: 12,
    scoredAnime: 1,
    rewatches: 0,
    favoriteAnimeCount: 0,
    genres:
      new Map(),
  };

describe(
  'AchievementsService',
  () => {
    it(
      'returns public achievement progress and unlock state',
      async () => {
        let userLookupCount = 0;

        const userFindUnique =
          jest.fn(
            async (
              _args: unknown,
            ) => {
              userLookupCount += 1;

              if (
                userLookupCount ===
                1
              ) {
                return {
                  id:
                    '11111111-1111-4111-8111-111111111111',
                };
              }

              return {
                id:
                  '11111111-1111-4111-8111-111111111111',

                username:
                  'tegar',

                equippedTitleAchievement:
                  null,
              };
            },
          );

        const prisma = {
          user: {
            findUnique:
              userFindUnique,
          },

          achievement: {
            findMany:
              jest.fn(
                async () => [
                  {
                    id:
                      '22222222-2222-4222-8222-222222222222',

                    code:
                      'FIRST_STEP',

                    name:
                      'First Step',

                    description:
                      'Add your first anime to your list.',

                    category:
                      AchievementCategory
                        .JOURNEY,

                    metric:
                      AchievementMetric
                        .TRACKED_ANIME,

                    threshold:
                      1,

                    targetKey:
                      null,

                    iconKey:
                      'list-plus',

                    titleReward:
                      null,

                    sortOrder:
                      10,
                  },
                ],
              ),
          },

          userAchievement: {
            findMany:
              jest.fn(
                async () => [
                  {
                    achievementId:
                      '22222222-2222-4222-8222-222222222222',

                    unlockedAt:
                      new Date(
                        '2026-10-08T00:00:00.000Z',
                      ),

                    showcasePosition:
                      1,
                  },
                ],
              ),
          },
        } as unknown as
          PrismaService;

        const evaluator = {
          getUserMetrics:
            jest.fn(
              async () =>
                metrics,
            ),

          getMetricValue:
            jest.fn(
              () => 1,
            ),
        } as unknown as
          AchievementEvaluatorService;

        const service =
          new AchievementsService(
            prisma,
            evaluator,
          );

        const result =
          await service
            .findPublic(
              'TEGAR',
            );

        expect(
          result?.username,
        ).toBe(
          'tegar',
        );

        expect(
          result?.unlockedCount,
        ).toBe(1);

        expect(
          result?.items[0],
        ).toMatchObject({
          code:
            'FIRST_STEP',

          progress: 1,
          progressPercent: 100,
          unlocked: true,
          showcasePosition: 1,
        });

        expect(
          result?.showcase,
        ).toHaveLength(1);
      },
    );

    it(
      'rejects invalid showcase positions',
      async () => {
        const service =
          new AchievementsService(
            {} as PrismaService,

            {} as
              AchievementEvaluatorService,
          );

        await expect(
          service.setShowcase(
            'user-id',
            '22222222-2222-4222-8222-222222222222',
            4,
          ),
        ).rejects.toBeInstanceOf(
          AchievementValidationError,
        );
      },
    );

    it(
      'rejects equipping an achievement that is not unlocked',
      async () => {
        const prisma = {
          userAchievement: {
            findUnique:
              jest.fn(
                async () =>
                  null,
              ),
          },
        } as unknown as
          PrismaService;

        const service =
          new AchievementsService(
            prisma,

            {} as
              AchievementEvaluatorService,
          );

        await expect(
          service.equipTitle(
            'user-id',
            '22222222-2222-4222-8222-222222222222',
          ),
        ).rejects.toThrow(
          'must be unlocked',
        );
      },
    );
  },
);
