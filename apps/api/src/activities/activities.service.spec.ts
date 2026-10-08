import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  ActivityType,
  ActivityVisibility,
} from '@prisma/client';

import type {
  PrismaService,
} from '../database/prisma.service.js';

import {
  ActivitiesService,
} from './activities.service.js';

const VIEWER_ID =
  '11111111-1111-4111-8111-111111111111';

const TARGET_ID =
  '22222222-2222-4222-8222-222222222222';

function createActivity() {
  return {
    id:
      '33333333-3333-4333-8333-333333333333',

    type:
      ActivityType.TEXT,

    text:
      'Hello anime world',

    animeStatus: null,
    progressEpisodes:
      null,

    user: {
      username:
        'target_user',

      displayName:
        'Target',

      avatarUrl: null,

      role: 'USER',
    },

    anime: null,
    achievement: null,

    _count: {
      likes: 0,
      replies: 0,
    },

    createdAt:
      new Date(
        '2026-10-08T00:00:00.000Z',
      ),
  };
}

describe(
  'ActivitiesService',
  () => {
    it(
      'returns only public activity in the community feed',
      async () => {
        const count =
          jest.fn(
            async (
              _args: unknown,
            ) => 1,
          );

        const findMany =
          jest.fn(
            async () => [
              createActivity(),
            ],
          );

        const prisma = {
          activity: {
            count,
            findMany,
          },
        } as unknown as PrismaService;

        const service =
          new ActivitiesService(
            prisma,
          );

        const result =
          await service
            .findPublicFeed({
              page: 1,
              perPage: 20,
            });

        expect(
          result.pageInfo.total,
        ).toBe(1);

        expect(
          result.items,
        ).toHaveLength(1);

        expect(
          count,
        ).toHaveBeenCalledWith({
          where: {
            user: {
              OR: [
                {
                  socialSettings: {
                    is: null,
                  },
                },
                {
                  socialSettings: {
                    is: {
                      activityVisibility:
                        ActivityVisibility
                          .PUBLIC,
                    },
                  },
                },
              ],
            },
          },
        });
      },
    );

    it(
      'returns empty following feed when viewer follows nobody',
      async () => {
        const activityCount =
          jest.fn();

        const prisma = {
          userFollow: {
            findMany:
              jest.fn(
                async () => [],
              ),
          },

          activity: {
            count:
              activityCount,
          },
        } as unknown as PrismaService;

        const service =
          new ActivitiesService(
            prisma,
          );

        await expect(
          service
            .findFollowingFeed(
              VIEWER_ID,
            ),
        ).resolves.toEqual({
          items: [],

          pageInfo: {
            page: 1,
            perPage: 20,
            total: 0,
            pageCount: 0,
            hasNextPage:
              false,
            hasPreviousPage:
              false,
          },
        });

        expect(
          activityCount,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'hides follower-only user feed from strangers',
      async () => {
        const count =
          jest.fn();

        const prisma = {
          user: {
            findUnique:
              jest.fn(
                async () => ({
                  id:
                    TARGET_ID,

                  socialSettings: {
                    activityVisibility:
                      ActivityVisibility
                        .FOLLOWERS,
                  },
                }),
              ),
          },

          userFollow: {
            findUnique:
              jest.fn(
                async () => null,
              ),
          },

          activity: {
            count,
          },
        } as unknown as PrismaService;

        const service =
          new ActivitiesService(
            prisma,
          );

        const result =
          await service
            .findUserFeed(
              'TARGET_USER',
              VIEWER_ID,
            );

        expect(
          result?.items,
        ).toEqual([]);

        expect(
          count,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'allows followers to view follower-only user activity',
      async () => {
        const prisma = {
          user: {
            findUnique:
              jest.fn(
                async () => ({
                  id:
                    TARGET_ID,

                  socialSettings: {
                    activityVisibility:
                      ActivityVisibility
                        .FOLLOWERS,
                  },
                }),
              ),
          },

          userFollow: {
            findUnique:
              jest.fn(
                async () => ({
                  id:
                    'follow-id',
                }),
              ),
          },

          activity: {
            count:
              jest.fn(
                async () => 1,
              ),

            findMany:
              jest.fn(
                async () => [
                  createActivity(),
                ],
              ),
          },
        } as unknown as PrismaService;

        const service =
          new ActivitiesService(
            prisma,
          );

        const result =
          await service
            .findUserFeed(
              'target_user',
              VIEWER_ID,
            );

        expect(
          result?.items,
        ).toHaveLength(1);
      },
    );

    it(
      'creates explicit text activity without requiring auto activity',
      async () => {
        const activity =
          createActivity();

        const settingsUpsert =
          {
            userId:
              TARGET_ID,
          };

        const prisma = {
          userSocialSettings: {
            upsert:
              jest.fn(
                () =>
                  settingsUpsert,
              ),
          },

          activity: {
            create:
              jest.fn(
                () =>
                  activity,
              ),
          },

          $transaction:
            jest.fn(
              async (
                operations:
                  unknown[],
              ) =>
                Promise.all(
                  operations,
                ),
            ),
        } as unknown as PrismaService;

        const service =
          new ActivitiesService(
            prisma,
          );

        const result =
          await service
            .createText(
              TARGET_ID,
              '  Hello anime world  ',
            );

        expect(
          result.text,
        ).toBe(
          'Hello anime world',
        );
      },
    );

    it(
      'scopes activity deletion to the authenticated user',
      async () => {
        const deleteMany =
          jest.fn(
            async (
              _args: unknown,
            ) => ({
              count: 1,
            }),
          );

        const prisma = {
          activity: {
            deleteMany,
          },
        } as unknown as PrismaService;

        const service =
          new ActivitiesService(
            prisma,
          );

        await expect(
          service.deleteMine(
            VIEWER_ID,
            '33333333-3333-4333-8333-333333333333',
          ),
        ).resolves.toBe(true);

        expect(
          deleteMany,
        ).toHaveBeenCalledWith({
          where: {
            id:
              '33333333-3333-4333-8333-333333333333',

            userId:
              VIEWER_ID,
          },
        });
      },
    );
  },
);
