import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  AnimeCatalogStatus,
  AnimeFormat,
  AnimeReleaseStatus,
  AnimeSeason,
} from '@prisma/client';

import type {
  PrismaService,
} from '../database/prisma.service.js';

import {
  AnimeFavoritesService,
} from './anime-favorites.service.js';

const USER_ID =
  '11111111-1111-4111-8111-111111111111';

const OTHER_USER_ID =
  '22222222-2222-4222-8222-222222222222';

const ANIME_ID =
  '33333333-3333-4333-8333-333333333333';

const FAVORITE_ID =
  '44444444-4444-4444-8444-444444444444';

function createFavoriteRecord() {
  return {
    id:
      FAVORITE_ID,

    createdAt:
      new Date(
        '2026-10-07T00:00:00.000Z',
      ),

    anime: {
      id:
        ANIME_ID,

      slug:
        'example-anime',

      title:
        'Example Anime',

      format:
        AnimeFormat.TV,

      status:
        AnimeReleaseStatus
          .FINISHED,

      episodes: 12,

      season:
        AnimeSeason.FALL,

      seasonYear: 2025,

      coverImageUrl:
        null,
    },
  };
}

describe(
  'AnimeFavoritesService',
  () => {
    it(
      'returns null for an invalid public username without querying the database',
      async () => {
        const findUnique =
          jest.fn();

        const prisma = {
          user: {
            findUnique,
          },
        } as unknown as PrismaService;

        const service =
          new AnimeFavoritesService(
            prisma,
          );

        await expect(
          service.findPublic(
            'INVALID USER!',
          ),
        ).resolves.toBeNull();

        expect(
          findUnique,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'returns null when the public user does not exist',
      async () => {
        const findUnique =
          jest.fn(
            async (
              _args: unknown,
            ) =>
              null,
          );

        const prisma = {
          user: {
            findUnique,
          },

          animeFavorite: {
            findMany:
              jest.fn(),
          },
        } as unknown as PrismaService;

        const service =
          new AnimeFavoritesService(
            prisma,
          );

        await expect(
          service.findPublic(
            'missing_user',
          ),
        ).resolves.toBeNull();

        expect(
          findUnique,
        ).toHaveBeenCalledWith({
          where: {
            username:
              'missing_user',
          },

          select: {
            id: true,
            username: true,
          },
        });
      },
    );

    it(
      'normalizes username and exposes only included anime in public favorites',
      async () => {
        const findUnique =
          jest.fn(
            async (
              _args: unknown,
            ) => ({
              id:
                USER_ID,

              username:
                'test_user',
            }),
          );

        const findMany =
          jest.fn(
            async (
              _args: unknown,
            ) => [
              createFavoriteRecord(),
            ],
          );

        const prisma = {
          user: {
            findUnique,
          },

          animeFavorite: {
            findMany,
          },
        } as unknown as PrismaService;

        const service =
          new AnimeFavoritesService(
            prisma,
          );

        const result =
          await service.findPublic(
            '  TEST_USER  ',
          );

        expect(
          result?.username,
        ).toBe(
          'test_user',
        );

        expect(
          result?.items,
        ).toHaveLength(
          1,
        );

        expect(
          result?.items[0]
            ?.anime.id,
        ).toBe(
          ANIME_ID,
        );

        expect(
          findUnique,
        ).toHaveBeenCalledWith({
          where: {
            username:
              'test_user',
          },

          select: {
            id: true,
            username: true,
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
            },

            orderBy: [
              {
                createdAt:
                  'desc',
              },
              {
                id: 'asc',
              },
            ],
          }),
        );
      },
    );

    it(
      'scopes current-user favorite lookup to the authenticated user and included anime',
      async () => {
        const findFirst =
          jest.fn(
            async (
              _args: unknown,
            ) =>
              createFavoriteRecord(),
          );

        const prisma = {
          animeFavorite: {
            findFirst,
          },
        } as unknown as PrismaService;

        const service =
          new AnimeFavoritesService(
            prisma,
          );

        const result =
          await service.findMine(
            USER_ID,
            ANIME_ID,
          );

        expect(
          result?.id,
        ).toBe(
          FAVORITE_ID,
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
      'returns null for current-user lookup with an invalid anime id',
      async () => {
        const findFirst =
          jest.fn();

        const prisma = {
          animeFavorite: {
            findFirst,
          },
        } as unknown as PrismaService;

        const service =
          new AnimeFavoritesService(
            prisma,
          );

        await expect(
          service.findMine(
            USER_ID,
            'invalid-id',
          ),
        ).resolves.toBeNull();

        expect(
          findFirst,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects adding an anime that is not available in the included catalog',
      async () => {
        const findFirst =
          jest.fn(
            async (
              _args: unknown,
            ) =>
              null,
          );

        const upsert =
          jest.fn();

        const prisma = {
          anime: {
            findFirst,
          },

          animeFavorite: {
            upsert,
          },
        } as unknown as PrismaService;

        const service =
          new AnimeFavoritesService(
            prisma,
          );

        await expect(
          service.add(
            USER_ID,
            ANIME_ID,
          ),
        ).rejects.toThrow(
          'Anime is not available to favorite.',
        );

        expect(
          findFirst,
        ).toHaveBeenCalledWith({
          where: {
            id:
              ANIME_ID,

            catalogStatus:
              AnimeCatalogStatus
                .INCLUDED,
          },

          select: {
            id: true,
          },
        });

        expect(
          upsert,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'adds favorites idempotently using the user and anime composite key',
      async () => {
        const findFirst =
          jest.fn(
            async (
              _args: unknown,
            ) => ({
              id:
                ANIME_ID,
            }),
          );

        const upsert =
          jest.fn(
            async (
              _args: unknown,
            ) =>
              createFavoriteRecord(),
          );

        const prisma = {
          anime: {
            findFirst,
          },

          animeFavorite: {
            upsert,
          },
        } as unknown as PrismaService;

        const service =
          new AnimeFavoritesService(
            prisma,
          );

        const result =
          await service.add(
            USER_ID,
            ANIME_ID,
          );

        expect(
          result.id,
        ).toBe(
          FAVORITE_ID,
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

            create: {
              userId:
                USER_ID,

              animeId:
                ANIME_ID,
            },

            update: {},
          }),
        );
      },
    );

    it(
      'scopes favorite deletion to the authenticated user',
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
          animeFavorite: {
            deleteMany,
          },
        } as unknown as PrismaService;

        const service =
          new AnimeFavoritesService(
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
      'returns false when removing an invalid anime id',
      async () => {
        const deleteMany =
          jest.fn();

        const prisma = {
          animeFavorite: {
            deleteMany,
          },
        } as unknown as PrismaService;

        const service =
          new AnimeFavoritesService(
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
  },
);
