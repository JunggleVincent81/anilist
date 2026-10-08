import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  ActivityVisibility,
  UserRole,
} from '@prisma/client';

import type {
  PrismaService,
} from '../database/prisma.service.js';

import {
  ActivityInteractionValidationError,
  ActivityUnavailableError,
} from './activity-interactions.errors.js';

import {
  ActivityInteractionsService,
} from './activity-interactions.service.js';

const VIEWER_ID =
  '11111111-1111-4111-8111-111111111111';

const OWNER_ID =
  '22222222-2222-4222-8222-222222222222';

const ACTIVITY_ID =
  '33333333-3333-4333-8333-333333333333';

const REPLY_ID =
  '44444444-4444-4444-8444-444444444444';

function visibleActivity(
  visibility:
    ActivityVisibility | null =
      ActivityVisibility.PUBLIC,
) {
  return {
    id:
      ACTIVITY_ID,

    userId:
      OWNER_ID,

    user: {
      socialSettings:
        visibility === null
          ? null
          : {
              activityVisibility:
                visibility,
            },
    },
  };
}

function replyRecord(
  body = 'Nice update',
) {
  return {
    id:
      REPLY_ID,

    activityId:
      ACTIVITY_ID,

    body,

    createdAt:
      new Date(
        '2026-10-08T10:00:00.000Z',
      ),

    user: {
      username:
        'viewer',

      displayName:
        'Viewer',

      avatarUrl:
        null,

      role:
        UserRole.USER,
    },
  };
}

describe(
  'ActivityInteractionsService',
  () => {
    it(
      'allows liking public activity when settings do not exist',
      async () => {
        const upsert =
          jest.fn(
            async (
              _args: unknown,
            ) => ({
              id:
                'like-id',
            }),
          );

        const prisma = {
          activity: {
            findUnique:
              jest.fn(
                async () =>
                  visibleActivity(
                    null,
                  ),
              ),
          },

          activityLike: {
            upsert,
          },
        } as unknown as
          PrismaService;

        const service =
          new ActivityInteractionsService(
            prisma,
          );

        await expect(
          service.like(
            VIEWER_ID,
            ACTIVITY_ID,
          ),
        ).resolves.toBe(
          true,
        );

        expect(
          upsert,
        ).toHaveBeenCalledWith({
          where: {
            activityId_userId:
              {
                activityId:
                  ACTIVITY_ID,

                userId:
                  VIEWER_ID,
              },
          },

          create: {
            activityId:
              ACTIVITY_ID,

            userId:
              VIEWER_ID,
          },

          update: {},

          select: {
            id: true,
          },
        });
      },
    );

    it(
      'allows a follower to interact with follower-only activity',
      async () => {
        const upsert =
          jest.fn(
            async () => ({
              id:
                'like-id',
            }),
          );

        const prisma = {
          activity: {
            findUnique:
              jest.fn(
                async () =>
                  visibleActivity(
                    ActivityVisibility
                      .FOLLOWERS,
                  ),
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

          activityLike: {
            upsert,
          },
        } as unknown as
          PrismaService;

        const service =
          new ActivityInteractionsService(
            prisma,
          );

        await expect(
          service.like(
            VIEWER_ID,
            ACTIVITY_ID,
          ),
        ).resolves.toBe(
          true,
        );

        expect(
          upsert,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    it(
      'rejects a stranger interacting with follower-only activity',
      async () => {
        const upsert =
          jest.fn();

        const prisma = {
          activity: {
            findUnique:
              jest.fn(
                async () =>
                  visibleActivity(
                    ActivityVisibility
                      .FOLLOWERS,
                  ),
              ),
          },

          userFollow: {
            findUnique:
              jest.fn(
                async () =>
                  null,
              ),
          },

          activityLike: {
            upsert,
          },
        } as unknown as
          PrismaService;

        const service =
          new ActivityInteractionsService(
            prisma,
          );

        await expect(
          service.like(
            VIEWER_ID,
            ACTIVITY_ID,
          ),
        ).rejects.toBeInstanceOf(
          ActivityUnavailableError,
        );

        expect(
          upsert,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects private activity for non-owner',
      async () => {
        const prisma = {
          activity: {
            findUnique:
              jest.fn(
                async () =>
                  visibleActivity(
                    ActivityVisibility
                      .PRIVATE,
                  ),
              ),
          },
        } as unknown as
          PrismaService;

        const service =
          new ActivityInteractionsService(
            prisma,
          );

        await expect(
          service.createReply(
            VIEWER_ID,
            ACTIVITY_ID,
            'hello',
          ),
        ).rejects.toBeInstanceOf(
          ActivityUnavailableError,
        );
      },
    );

    it(
      'trims reply body before creating it',
      async () => {
        const create =
          jest.fn(
            async (
              args: {
                data: {
                  body:
                    string;
                };
              },
            ) =>
              replyRecord(
                args.data.body,
              ),
          );

        const prisma = {
          activity: {
            findUnique:
              jest.fn(
                async () =>
                  visibleActivity(),
              ),
          },

          activityReply: {
            create,
          },
        } as unknown as
          PrismaService;

        const service =
          new ActivityInteractionsService(
            prisma,
          );

        const result =
          await service
            .createReply(
              VIEWER_ID,
              ACTIVITY_ID,
              '  Nice update  ',
            );

        expect(
          result.body,
        ).toBe(
          'Nice update',
        );

        expect(
          create,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            data: {
              activityId:
                ACTIVITY_ID,

              userId:
                VIEWER_ID,

              body:
                'Nice update',
            },
          }),
        );
      },
    );

    it(
      'rejects whitespace-only reply',
      async () => {
        const create =
          jest.fn();

        const prisma = {
          activity: {
            findUnique:
              jest.fn(
                async () =>
                  visibleActivity(),
              ),
          },

          activityReply: {
            create,
          },
        } as unknown as
          PrismaService;

        const service =
          new ActivityInteractionsService(
            prisma,
          );

        await expect(
          service.createReply(
            VIEWER_ID,
            ACTIVITY_ID,
            '     ',
          ),
        ).rejects.toBeInstanceOf(
          ActivityInteractionValidationError,
        );

        expect(
          create,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'returns replies oldest first with pagination',
      async () => {
        const findMany =
          jest.fn(
            async (
              _args: unknown,
            ) => [
              replyRecord(
                'First',
              ),
            ],
          );

        const prisma = {
          activity: {
            findUnique:
              jest.fn(
                async () =>
                  visibleActivity(),
              ),
          },

          activityReply: {
            count:
              jest.fn(
                async () => 3,
              ),

            findMany,
          },
        } as unknown as
          PrismaService;

        const service =
          new ActivityInteractionsService(
            prisma,
          );

        const result =
          await service
            .findReplies(
              ACTIVITY_ID,
              VIEWER_ID,
              {
                page: 1,
                perPage: 2,
              },
            );

        expect(
          result?.pageInfo,
        ).toEqual({
          page: 1,
          perPage: 2,
          total: 3,
          pageCount: 2,
          hasNextPage:
            true,
          hasPreviousPage:
            false,
        });

        expect(
          findMany,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            orderBy: [
              {
                createdAt:
                  'asc',
              },
              {
                id:
                  'asc',
              },
            ],

            skip: 0,
            take: 2,
          }),
        );
      },
    );

    it(
      'scopes reply deletion to its author',
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
          activityReply: {
            deleteMany,
          },
        } as unknown as
          PrismaService;

        const service =
          new ActivityInteractionsService(
            prisma,
          );

        await expect(
          service.deleteMine(
            VIEWER_ID,
            REPLY_ID,
          ),
        ).resolves.toBe(
          true,
        );

        expect(
          deleteMany,
        ).toHaveBeenCalledWith({
          where: {
            id:
              REPLY_ID,

            userId:
              VIEWER_ID,
          },
        });
      },
    );

    it(
      'scopes unlike to current user and activity',
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
          activityLike: {
            deleteMany,
          },
        } as unknown as
          PrismaService;

        const service =
          new ActivityInteractionsService(
            prisma,
          );

        await expect(
          service.unlike(
            VIEWER_ID,
            ACTIVITY_ID,
          ),
        ).resolves.toBe(
          true,
        );

        expect(
          deleteMany,
        ).toHaveBeenCalledWith({
          where: {
            activityId:
              ACTIVITY_ID,

            userId:
              VIEWER_ID,
          },
        });
      },
    );
  },
);
