import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  AnimeCatalogStatus,
  AnimeFormat,
  AnimeListStatus,
  AnimeReleaseStatus,
} from '@prisma/client';

import type {
  PrismaService,
} from '../database/prisma.service.js';

import {
  AnimeTrackingValidationError,
} from './anime-tracking.errors.js';

import {
  AnimeTrackingService,
} from './anime-tracking.service.js';

const USER_ID =
  '11111111-1111-4111-8111-111111111111';

const OTHER_USER_ID =
  '22222222-2222-4222-8222-222222222222';

const ANIME_ID =
  '33333333-3333-4333-8333-333333333333';

const ENTRY_ID =
  '44444444-4444-4444-8444-444444444444';

function createAnimeRecord(
  episodes: number | null = 12,
) {
  return {
    id: ANIME_ID,
    episodes,
  };
}

function createEntryRecord(
  overrides: Partial<{
    status: AnimeListStatus;
    progressEpisodes: number;
    rewatchCount: number;
    startedAt: Date | null;
    completedAt: Date | null;
  }> = {},
) {
  return {
    id: ENTRY_ID,

    status:
      overrides.status ??
      AnimeListStatus.WATCHING,

    progressEpisodes:
      overrides.progressEpisodes ??
      3,

    score: null,

    rewatchCount:
      overrides.rewatchCount ??
      0,

    startedAt:
      overrides.startedAt ??
      new Date(
        '2026-01-01T00:00:00.000Z',
      ),

    completedAt:
      overrides.completedAt ??
      null,

    createdAt:
      new Date(
        '2026-01-01T00:00:00.000Z',
      ),

    updatedAt:
      new Date(
        '2026-01-02T00:00:00.000Z',
      ),

    anime: {
      id: ANIME_ID,

      slug:
        'example-anime',

      title:
        'Example Anime',

      format:
        AnimeFormat.TV,

      status:
        AnimeReleaseStatus.FINISHED,

      episodes: 12,

      season: null,
      seasonYear: 2026,

      coverImageUrl: null,
    },
  };
}

describe(
  'AnimeTrackingService',
  () => {
    it(
      'rejects anime that is not available for tracking',
      async () => {
        const animeFindFirst =
          jest.fn(
            async (_args: unknown) =>
              null,
          );

        const entryFindUnique =
          jest.fn();

        const upsert =
          jest.fn();

        const prisma = {
          anime: {
            findFirst:
              animeFindFirst,
          },

          animeListEntry: {
            findUnique:
              entryFindUnique,

            upsert,
          },
        } as unknown as PrismaService;

        const service =
          new AnimeTrackingService(
            prisma,
          );

        await expect(
          service.upsert(
            USER_ID,
            {
              animeId:
                ANIME_ID,

              status:
                AnimeListStatus
                  .WATCHING,
            },
          ),
        ).rejects.toBeInstanceOf(
          AnimeTrackingValidationError,
        );

        expect(
          animeFindFirst,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              id:
                ANIME_ID,

              catalogStatus:
                AnimeCatalogStatus
                  .INCLUDED,
            },
          }),
        );

        expect(
          entryFindUnique,
        ).not.toHaveBeenCalled();

        expect(
          upsert,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects progress above known episode count',
      async () => {
        const upsert =
          jest.fn();

        const prisma = {
          anime: {
            findFirst:
              jest.fn(
                async (_args: unknown) =>
                  createAnimeRecord(
                    12,
                  ),
              ),
          },

          animeListEntry: {
            findUnique:
              jest.fn(
                async (_args: unknown) =>
                  null,
              ),

            upsert,
          },
        } as unknown as PrismaService;

        const service =
          new AnimeTrackingService(
            prisma,
          );

        await expect(
          service.upsert(
            USER_ID,
            {
              animeId:
                ANIME_ID,

              status:
                AnimeListStatus
                  .WATCHING,

              progressEpisodes:
                13,
            },
          ),
        ).rejects.toThrow(
          'Episode progress cannot exceed 12.',
        );

        expect(
          upsert,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'allows progress when total episode count is unknown',
      async () => {
        const result =
          createEntryRecord({
            progressEpisodes:
              27,
          });

        const upsert =
          jest.fn(
            async (_args: unknown) =>
              result,
          );

        const prisma = {
          anime: {
            findFirst:
              jest.fn(
                async (_args: unknown) =>
                  createAnimeRecord(
                    null,
                  ),
              ),
          },

          animeListEntry: {
            findUnique:
              jest.fn(
                async (_args: unknown) =>
                  null,
              ),

            upsert,
          },
        } as unknown as PrismaService;

        const service =
          new AnimeTrackingService(
            prisma,
          );

        await service.upsert(
          USER_ID,
          {
            animeId:
              ANIME_ID,

            status:
              AnimeListStatus
                .WATCHING,

            progressEpisodes:
              27,
          },
        );

        expect(
          upsert,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            create:
              expect.objectContaining({
                progressEpisodes:
                  27,
              }),
          }),
        );
      },
    );

    it(
      'rejects score outside 0.5 increments',
      async () => {
        const upsert =
          jest.fn();

        const prisma = {
          anime: {
            findFirst:
              jest.fn(
                async (_args: unknown) =>
                  createAnimeRecord(),
              ),
          },

          animeListEntry: {
            findUnique:
              jest.fn(
                async (_args: unknown) =>
                  null,
              ),

            upsert,
          },
        } as unknown as PrismaService;

        const service =
          new AnimeTrackingService(
            prisma,
          );

        await expect(
          service.upsert(
            USER_ID,
            {
              animeId:
                ANIME_ID,

              status:
                AnimeListStatus
                  .WATCHING,

              score: 8.3,
            },
          ),
        ).rejects.toThrow(
          'Score must be between 1.0 and 10.0 in 0.5 increments.',
        );

        expect(
          upsert,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'accepts a valid half-step score',
      async () => {
        const result =
          createEntryRecord();

        const upsert =
          jest.fn(
            async (_args: unknown) =>
              result,
          );

        const prisma = {
          anime: {
            findFirst:
              jest.fn(
                async (_args: unknown) =>
                  createAnimeRecord(),
              ),
          },

          animeListEntry: {
            findUnique:
              jest.fn(
                async (_args: unknown) =>
                  null,
              ),

            upsert,
          },
        } as unknown as PrismaService;

        const service =
          new AnimeTrackingService(
            prisma,
          );

        await service.upsert(
          USER_ID,
          {
            animeId:
              ANIME_ID,

            status:
              AnimeListStatus
                .WATCHING,

            score: 8.5,
          },
        );

        expect(
          upsert,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            create:
              expect.objectContaining({
                score: 8.5,
              }),
          }),
        );
      },
    );

    it(
      'sets completed progress to the known episode count',
      async () => {
        const result =
          createEntryRecord({
            status:
              AnimeListStatus
                .COMPLETED,

            progressEpisodes:
              12,

            completedAt:
              new Date(),
          });

        const upsert =
          jest.fn(
            async (_args: unknown) =>
              result,
          );

        const prisma = {
          anime: {
            findFirst:
              jest.fn(
                async (_args: unknown) =>
                  createAnimeRecord(
                    12,
                  ),
              ),
          },

          animeListEntry: {
            findUnique:
              jest.fn(
                async (_args: unknown) =>
                  null,
              ),

            upsert,
          },
        } as unknown as PrismaService;

        const service =
          new AnimeTrackingService(
            prisma,
          );

        await service.upsert(
          USER_ID,
          {
            animeId:
              ANIME_ID,

            status:
              AnimeListStatus
                .COMPLETED,

            progressEpisodes:
              4,
          },
        );

        expect(
          upsert,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            create:
              expect.objectContaining({
                status:
                  AnimeListStatus
                    .COMPLETED,

                progressEpisodes:
                  12,

                startedAt:
                  expect.any(
                    Date,
                  ),

                completedAt:
                  expect.any(
                    Date,
                  ),
              }),
          }),
        );
      },
    );

    it(
      'resets progress when entering rewatching without explicit progress',
      async () => {
        const existingStartedAt =
          new Date(
            '2026-01-01T00:00:00.000Z',
          );

        const result =
          createEntryRecord({
            status:
              AnimeListStatus
                .REWATCHING,

            progressEpisodes:
              0,

            startedAt:
              existingStartedAt,
          });

        const upsert =
          jest.fn(
            async (_args: unknown) =>
              result,
          );

        const prisma = {
          anime: {
            findFirst:
              jest.fn(
                async (_args: unknown) =>
                  createAnimeRecord(),
              ),
          },

          animeListEntry: {
            findUnique:
              jest.fn(
                async (_args: unknown) => ({
                  status:
                    AnimeListStatus
                      .COMPLETED,

                  progressEpisodes:
                    12,

                  score: null,

                  rewatchCount:
                    0,

                  startedAt:
                    existingStartedAt,

                  completedAt:
                    new Date(
                      '2026-01-05T00:00:00.000Z',
                    ),
                }),
              ),

            upsert,
          },
        } as unknown as PrismaService;

        const service =
          new AnimeTrackingService(
            prisma,
          );

        await service.upsert(
          USER_ID,
          {
            animeId:
              ANIME_ID,

            status:
              AnimeListStatus
                .REWATCHING,
          },
        );

        expect(
          upsert,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            update:
              expect.objectContaining({
                status:
                  AnimeListStatus
                    .REWATCHING,

                progressEpisodes:
                  0,

                rewatchCount:
                  0,
              }),
          }),
        );
      },
    );

    it(
      'increments rewatch count only when rewatching becomes completed',
      async () => {
        const startedAt =
          new Date(
            '2026-01-01T00:00:00.000Z',
          );

        const result =
          createEntryRecord({
            status:
              AnimeListStatus
                .COMPLETED,

            progressEpisodes:
              12,

            rewatchCount:
              3,

            startedAt,

            completedAt:
              new Date(),
          });

        const upsert =
          jest.fn(
            async (_args: unknown) =>
              result,
          );

        const prisma = {
          anime: {
            findFirst:
              jest.fn(
                async (_args: unknown) =>
                  createAnimeRecord(),
              ),
          },

          animeListEntry: {
            findUnique:
              jest.fn(
                async (_args: unknown) => ({
                  status:
                    AnimeListStatus
                      .REWATCHING,

                  progressEpisodes:
                    11,

                  score: null,

                  rewatchCount:
                    2,

                  startedAt,

                  completedAt:
                    new Date(
                      '2026-01-03T00:00:00.000Z',
                    ),
                }),
              ),

            upsert,
          },
        } as unknown as PrismaService;

        const service =
          new AnimeTrackingService(
            prisma,
          );

        await service.upsert(
          USER_ID,
          {
            animeId:
              ANIME_ID,

            status:
              AnimeListStatus
                .COMPLETED,
          },
        );

        expect(
          upsert,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            update:
              expect.objectContaining({
                status:
                  AnimeListStatus
                    .COMPLETED,

                progressEpisodes:
                  12,

                rewatchCount:
                  3,

                completedAt:
                  expect.any(
                    Date,
                  ),
              }),
          }),
        );
      },
    );

    it(
      'uses the user and anime composite key when upserting',
      async () => {
        const upsert =
          jest.fn(
            async (_args: unknown) =>
              createEntryRecord(),
          );

        const prisma = {
          anime: {
            findFirst:
              jest.fn(
                async (_args: unknown) =>
                  createAnimeRecord(),
              ),
          },

          animeListEntry: {
            findUnique:
              jest.fn(
                async (_args: unknown) =>
                  null,
              ),

            upsert,
          },
        } as unknown as PrismaService;

        const service =
          new AnimeTrackingService(
            prisma,
          );

        await service.upsert(
          USER_ID,
          {
            animeId:
              ANIME_ID,

            status:
              AnimeListStatus
                .WATCHING,
          },
        );

        expect(
          upsert,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              userId_animeId: {
                userId:
                  USER_ID,

                animeId:
                  ANIME_ID,
              },
            },

            create:
              expect.objectContaining({
                userId:
                  USER_ID,

                animeId:
                  ANIME_ID,
              }),
          }),
        );
      },
    );

    it(
      'scopes deletion to the current user',
      async () => {
        const deleteMany =
          jest.fn(
            async (_args: unknown) => ({
              count: 1,
            }),
          );

        const prisma = {
          animeListEntry: {
            deleteMany,
          },
        } as unknown as PrismaService;

        const service =
          new AnimeTrackingService(
            prisma,
          );

        await expect(
          service.remove(
            USER_ID,
            ANIME_ID,
          ),
        ).resolves.toBe(
          true,
        );

        expect(
          deleteMany,
        ).toHaveBeenCalledWith({
          where: {
            userId:
              USER_ID,

            animeId:
              ANIME_ID,
          },
        });

        expect(
          deleteMany,
        ).not.toHaveBeenCalledWith({
          where: {
            userId:
              OTHER_USER_ID,

            animeId:
              ANIME_ID,
          },
        });
      },
    );

    it(
      'returns false for deletion with an invalid anime id',
      async () => {
        const deleteMany =
          jest.fn();

        const prisma = {
          animeListEntry: {
            deleteMany,
          },
        } as unknown as PrismaService;

        const service =
          new AnimeTrackingService(
            prisma,
          );

        await expect(
          service.remove(
            USER_ID,
            'invalid-id',
          ),
        ).resolves.toBe(
          false,
        );

        expect(
          deleteMany,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'scopes current-user lookup to the authenticated user',
      async () => {
        const findFirst =
          jest.fn(
            async (_args: unknown) =>
              createEntryRecord(),
          );

        const prisma = {
          animeListEntry: {
            findFirst,
          },
        } as unknown as PrismaService;

        const service =
          new AnimeTrackingService(
            prisma,
          );

        const entry =
          await service.findMine(
            USER_ID,
            ANIME_ID,
          );

        expect(
          entry?.id,
        ).toBe(
          ENTRY_ID,
        );

        expect(
          findFirst,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              userId:
                USER_ID,

              animeId:
                ANIME_ID,

              anime: {
                catalogStatus:
                  AnimeCatalogStatus
                    .INCLUDED,
              },
            },
          }),
        );
      },
    );

    it(
      'filters public lists to included anime and requested status',
      async () => {
        const whereChecks:
          unknown[] = [];

        const count =
          jest.fn(
            async (
              args: unknown,
            ) => {
              whereChecks.push(
                args,
              );

              return 1;
            },
          );

        const findMany =
          jest.fn(
            async (
              args: unknown,
            ) => {
              whereChecks.push(
                args,
              );

              return [
                createEntryRecord({
                  status:
                    AnimeListStatus
                      .WATCHING,
                }),
              ];
            },
          );

        const prisma = {
          user: {
            findUnique:
              jest.fn(
                async (_args: unknown) => ({
                  id:
                    USER_ID,

                  username:
                    'test_user',
                }),
              ),
          },

          animeListEntry: {
            count,
            findMany,
          },
        } as unknown as PrismaService;

        const service =
          new AnimeTrackingService(
            prisma,
          );

        const result =
          await service.findPublicList({
            username:
              'TEST_USER',

            status:
              AnimeListStatus
                .WATCHING,

            page: 1,
            perPage: 20,
          });

        expect(
          result?.username,
        ).toBe(
          'test_user',
        );

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
          count,
        ).toHaveBeenCalledWith({
          where: {
            userId:
              USER_ID,

            anime: {
              catalogStatus:
                AnimeCatalogStatus
                  .INCLUDED,
            },

            status:
              AnimeListStatus
                .WATCHING,
          },
        });

        expect(
          findMany,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              userId:
                USER_ID,

              anime: {
                catalogStatus:
                  AnimeCatalogStatus
                    .INCLUDED,
              },

              status:
                AnimeListStatus
                  .WATCHING,
            },

            skip: 0,
            take: 20,
          }),
        );

        expect(
          whereChecks,
        ).toHaveLength(
          2,
        );
      },
    );
  },
);
