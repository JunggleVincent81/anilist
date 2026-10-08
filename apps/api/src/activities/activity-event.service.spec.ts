import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  ActivityType,
  AnimeListStatus,
} from '@prisma/client';

import type {
  PrismaService,
} from '../database/prisma.service.js';

import {
  ActivityEventService,
} from './activity-event.service.js';

const USER_ID =
  '11111111-1111-4111-8111-111111111111';

const ANIME_ID =
  '22222222-2222-4222-8222-222222222222';

function delta(
  overrides:
    Partial<{
      previousStatus:
        AnimeListStatus | null;

      nextStatus:
        AnimeListStatus;

      previousProgressEpisodes:
        number | null;

      nextProgressEpisodes:
        number;
    }> = {},
) {
  return {
    userId:
      USER_ID,

    animeId:
      ANIME_ID,

    previousStatus:
      AnimeListStatus
        .WATCHING,

    nextStatus:
      AnimeListStatus
        .WATCHING,

    previousProgressEpisodes:
      3,

    nextProgressEpisodes:
      4,

    ...overrides,
  };
}

describe(
  'ActivityEventService',
  () => {
    it(
      'does nothing when automatic activity is disabled',
      async () => {
        const create =
          jest.fn();

        const prisma = {
          userSocialSettings: {
            findUnique:
              jest.fn(
                async (
                  _args:
                    unknown,
                ) => ({
                  autoActivityEnabled:
                    false,
                }),
              ),
          },

          activity: {
            create,
          },
        } as unknown as PrismaService;

        const service =
          new ActivityEventService(
            prisma,
          );

        await service
          .recordTrackingUpdateBestEffort(
            delta(),
          );

        expect(
          create,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'does nothing when settings do not exist',
      async () => {
        const create =
          jest.fn();

        const prisma = {
          userSocialSettings: {
            findUnique:
              jest.fn(
                async (
                  _args:
                    unknown,
                ) => null,
              ),
          },

          activity: {
            create,
          },
        } as unknown as PrismaService;

        const service =
          new ActivityEventService(
            prisma,
          );

        await service
          .recordTrackingUpdateBestEffort(
            delta(),
          );

        expect(
          create,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'creates progress activity when only episode progress changes',
      async () => {
        const create =
          jest.fn(
            async (
              _args: unknown,
            ) => ({
              id:
                'activity-id',
            }),
          );

        const prisma = {
          userSocialSettings: {
            findUnique:
              jest.fn(
                async (
                  _args:
                    unknown,
                ) => ({
                  autoActivityEnabled:
                    true,
                }),
              ),
          },

          activity: {
            create,
          },
        } as unknown as PrismaService;

        const service =
          new ActivityEventService(
            prisma,
          );

        await service
          .recordTrackingUpdateBestEffort(
            delta(),
          );

        expect(
          create,
        ).toHaveBeenCalledWith({
          data: {
            userId:
              USER_ID,

            animeId:
              ANIME_ID,

            type:
              ActivityType
                .ANIME_PROGRESS,

            animeStatus:
              AnimeListStatus
                .WATCHING,

            progressEpisodes:
              4,
          },

          select: {
            id: true,
          },
        });
      },
    );

    it(
      'creates status activity when status changes',
      async () => {
        const create =
          jest.fn(
            async (
              _args: unknown,
            ) => ({
              id:
                'activity-id',
            }),
          );

        const prisma = {
          userSocialSettings: {
            findUnique:
              jest.fn(
                async (
                  _args:
                    unknown,
                ) => ({
                  autoActivityEnabled:
                    true,
                }),
              ),
          },

          activity: {
            create,
          },
        } as unknown as PrismaService;

        const service =
          new ActivityEventService(
            prisma,
          );

        await service
          .recordTrackingUpdateBestEffort(
            delta({
              previousStatus:
                AnimeListStatus
                  .WATCHING,

              nextStatus:
                AnimeListStatus
                  .COMPLETED,

              previousProgressEpisodes:
                11,

              nextProgressEpisodes:
                12,
            }),
          );

        expect(
          create,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          create,
        ).toHaveBeenCalledWith({
          data: {
            userId:
              USER_ID,

            animeId:
              ANIME_ID,

            type:
              ActivityType
                .ANIME_STATUS,

            animeStatus:
              AnimeListStatus
                .COMPLETED,

            progressEpisodes:
              12,
          },

          select: {
            id: true,
          },
        });
      },
    );

    it(
      'does not create activity for score-only updates',
      async () => {
        const create =
          jest.fn();

        const prisma = {
          userSocialSettings: {
            findUnique:
              jest.fn(
                async (
                  _args:
                    unknown,
                ) => ({
                  autoActivityEnabled:
                    true,
                }),
              ),
          },

          activity: {
            create,
          },
        } as unknown as PrismaService;

        const service =
          new ActivityEventService(
            prisma,
          );

        await service
          .recordTrackingUpdateBestEffort(
            delta({
              previousProgressEpisodes:
                4,

              nextProgressEpisodes:
                4,
            }),
          );

        expect(
          create,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'does not fail tracking flow when activity creation fails',
      async () => {
        const prisma = {
          userSocialSettings: {
            findUnique:
              jest.fn(
                async (
                  _args:
                    unknown,
                ) => ({
                  autoActivityEnabled:
                    true,
                }),
              ),
          },

          activity: {
            create:
              jest.fn(
                async (
                  _args:
                    unknown,
                ) => {
                  throw new Error(
                    'temporary failure',
                  );
                },
              ),
          },
        } as unknown as PrismaService;

        const service =
          new ActivityEventService(
            prisma,
          );

        await expect(
          service
            .recordTrackingUpdateBestEffort(
              delta(),
            ),
        ).resolves.toBeUndefined();
      },
    );
  },
);
