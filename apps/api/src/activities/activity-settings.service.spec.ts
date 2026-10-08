import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  ActivityVisibility,
} from '@prisma/client';

import type {
  PrismaService,
} from '../database/prisma.service.js';

import {
  ActivitySettingsService,
} from './activity-settings.service.js';

const USER_ID =
  '11111111-1111-4111-8111-111111111111';

describe(
  'ActivitySettingsService',
  () => {
    it(
      'returns privacy-first defaults when settings do not exist',
      async () => {
        const prisma = {
          userSocialSettings: {
            findUnique:
              jest.fn(
                async () =>
                  null,
              ),
          },
        } as unknown as PrismaService;

        const service =
          new ActivitySettingsService(
            prisma,
          );

        await expect(
          service.findMine(
            USER_ID,
          ),
        ).resolves.toEqual({
          autoActivityEnabled:
            false,

          activityVisibility:
            ActivityVisibility
              .PUBLIC,
        });
      },
    );

    it(
      'updates activity preferences with upsert',
      async () => {
        const upsert =
          jest.fn(
            async (
              _args: unknown,
            ) => ({
              autoActivityEnabled:
                true,

              activityVisibility:
                ActivityVisibility
                  .FOLLOWERS,
            }),
          );

        const prisma = {
          userSocialSettings: {
            upsert,
          },
        } as unknown as PrismaService;

        const service =
          new ActivitySettingsService(
            prisma,
          );

        const result =
          await service.updateMine(
            USER_ID,
            {
              autoActivityEnabled:
                true,

              activityVisibility:
                ActivityVisibility
                  .FOLLOWERS,
            },
          );

        expect(
          result,
        ).toEqual({
          autoActivityEnabled:
            true,

          activityVisibility:
            ActivityVisibility
              .FOLLOWERS,
        });

        expect(
          upsert,
        ).toHaveBeenCalledWith({
          where: {
            userId:
              USER_ID,
          },

          create: {
            userId:
              USER_ID,

            autoActivityEnabled:
              true,

            activityVisibility:
              ActivityVisibility
                .FOLLOWERS,
          },

          update: {
            autoActivityEnabled:
              true,

            activityVisibility:
              ActivityVisibility
                .FOLLOWERS,
          },

          select: {
            autoActivityEnabled:
              true,

            activityVisibility:
              true,
          },
        });
      },
    );

    it(
      'treats an empty update as a read',
      async () => {
        const findUnique =
          jest.fn(
            async () => ({
              autoActivityEnabled:
                false,

              activityVisibility:
                ActivityVisibility
                  .PRIVATE,
            }),
          );

        const upsert =
          jest.fn();

        const prisma = {
          userSocialSettings: {
            findUnique,
            upsert,
          },
        } as unknown as PrismaService;

        const service =
          new ActivitySettingsService(
            prisma,
          );

        await expect(
          service.updateMine(
            USER_ID,
            {},
          ),
        ).resolves.toEqual({
          autoActivityEnabled:
            false,

          activityVisibility:
            ActivityVisibility
              .PRIVATE,
        });

        expect(
          upsert,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
