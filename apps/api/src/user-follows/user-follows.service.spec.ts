import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import type {
  PrismaService,
} from '../database/prisma.service.js';
import type { NotificationsService } from '../notifications/notifications.service.js';

import {
  UserFollowValidationError,
} from './user-follows.errors.js';

import {
  UserFollowsService,
} from './user-follows.service.js';


const AN123_NOTIFICATION_MOCK = {
  notifyFollowBestEffort: jest.fn(async () => {}),
  notifyActivityLikeBestEffort: jest.fn(async () => {}),
  notifyActivityReplyBestEffort: jest.fn(async () => {}),
} as unknown as NotificationsService;

const VIEWER_ID =
  '11111111-1111-4111-8111-111111111111';

const TARGET_ID =
  '22222222-2222-4222-8222-222222222222';

function targetUser() {
  return {
    id: TARGET_ID,
    username:
      'target_user',
  };
}

describe(
  'UserFollowsService',
  () => {
    it(
      'returns null for invalid usernames without querying user',
      async () => {
        const findUnique =
          jest.fn();

        const prisma = {
          user: {
            findUnique,
          },
        } as unknown as PrismaService;

        const service =
          new UserFollowsService(prisma, AN123_NOTIFICATION_MOCK);

        await expect(
          service.findSummary(
            '!',
          ),
        ).resolves.toBeNull();

        expect(
          findUnique,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects following yourself',
      async () => {
        const upsert =
          jest.fn();

        const prisma = {
          user: {
            findUnique:
              jest.fn(
                async (
                  _args:
                    unknown,
                ) => ({
                  id:
                    VIEWER_ID,
                  username:
                    'viewer',
                }),
              ),
          },

          userFollow: {
            upsert,
          },
        } as unknown as PrismaService;

        const service =
          new UserFollowsService(prisma, AN123_NOTIFICATION_MOCK);

        await expect(
          service.follow(
            VIEWER_ID,
            'viewer',
          ),
        ).rejects.toBeInstanceOf(
          UserFollowValidationError,
        );

        expect(
          upsert,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'follows a user idempotently',
      async () => {
        let countCall = 0;

        const upsert =
          jest.fn(
            async (
              _args: unknown,
            ) => ({
              id: 'follow-id',
            }),
          );

        const count =
          jest.fn(
            async (
              _args: unknown,
            ) => {
              countCall += 1;

              return countCall;
            },
          );

        const findUniqueFollow =
          jest.fn(
            async (
              _args: unknown,
            ) => ({
              id: 'follow-id',
            }),
          );

        const prisma = {
          user: {
            findUnique:
              jest.fn(
                async (
                  _args:
                    unknown,
                ) =>
                  targetUser(),
              ),
          },

          userFollow: {
            upsert,
            count,

            findUnique:
              findUniqueFollow,
          },
        } as unknown as PrismaService;

        const service =
          new UserFollowsService(prisma, AN123_NOTIFICATION_MOCK);

        const result =
          await service.follow(
            VIEWER_ID,
            'TARGET_USER',
          );

        expect(
          upsert,
        ).toHaveBeenCalledWith({
          where: {
            followerId_followingId:
              {
                followerId:
                  VIEWER_ID,

                followingId:
                  TARGET_ID,
              },
          },

          create: {
            followerId:
              VIEWER_ID,

            followingId:
              TARGET_ID,
          },

          update: {},
        });

        expect(
          result.username,
        ).toBe(
          'target_user',
        );

        expect(
          result.isFollowing,
        ).toBe(true);

        expect(
          result.isSelf,
        ).toBe(false);
      },
    );

    it(
      'unfollows only the authenticated follower relationship',
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
          user: {
            findUnique:
              jest.fn(
                async (
                  _args:
                    unknown,
                ) =>
                  targetUser(),
              ),
          },

          userFollow: {
            deleteMany,

            count:
              jest.fn(
                async (
                  _args:
                    unknown,
                ) => 0,
              ),

            findUnique:
              jest.fn(
                async (
                  _args:
                    unknown,
                ) => null,
              ),
          },
        } as unknown as PrismaService;

        const service =
          new UserFollowsService(prisma, AN123_NOTIFICATION_MOCK);

        const result =
          await service.unfollow(
            VIEWER_ID,
            'target_user',
          );

        expect(
          deleteMany,
        ).toHaveBeenCalledWith({
          where: {
            followerId:
              VIEWER_ID,

            followingId:
              TARGET_ID,
          },
        });

        expect(
          result.isFollowing,
        ).toBe(false);
      },
    );

    it(
      'returns public follower counts',
      async () => {
        let countCall = 0;

        const prisma = {
          user: {
            findUnique:
              jest.fn(
                async (
                  _args:
                    unknown,
                ) =>
                  targetUser(),
              ),
          },

          userFollow: {
            count:
              jest.fn(
                async (
                  _args:
                    unknown,
                ) => {
                  countCall += 1;

                  return countCall ===
                    1
                    ? 7
                    : 3;
                },
              ),
          },
        } as unknown as PrismaService;

        const service =
          new UserFollowsService(prisma, AN123_NOTIFICATION_MOCK);

        await expect(
          service.findSummary(
            'TARGET_USER',
          ),
        ).resolves.toEqual({
          username:
            'target_user',

          followersCount: 7,
          followingCount: 3,
        });
      },
    );

    it(
      'returns paginated followers',
      async () => {
        const count =
          jest.fn(
            async (
              _args: unknown,
            ) => 1,
          );

        const findMany =
          jest.fn(
            async (
              _args: unknown,
            ) => [
              {
                id: 'follow-id',

                follower: {
                  username:
                    'viewer',

                  displayName:
                    'Viewer',

                  avatarUrl:
                    null,

                  role:
                    'USER',
                },
              },
            ],
          );

        const prisma = {
          user: {
            findUnique:
              jest.fn(
                async (
                  _args:
                    unknown,
                ) =>
                  targetUser(),
              ),
          },

          userFollow: {
            count,
            findMany,
          },
        } as unknown as PrismaService;

        const service =
          new UserFollowsService(prisma, AN123_NOTIFICATION_MOCK);

        const result =
          await service
            .findFollowers({
              username:
                'target_user',

              page: 1,
              perPage: 20,
            });

        expect(
          result?.users,
        ).toEqual([
          {
            username:
              'viewer',

            displayName:
              'Viewer',

            avatarUrl: null,
            role: 'USER',
          },
        ]);

        expect(
          result?.pageInfo,
        ).toEqual({
          page: 1,
          perPage: 20,
          total: 1,
          pageCount: 1,
          hasNextPage:
            false,
          hasPreviousPage:
            false,
        });

        expect(
          findMany,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            skip: 0,
            take: 20,
          }),
        );
      },
    );
  },
);
