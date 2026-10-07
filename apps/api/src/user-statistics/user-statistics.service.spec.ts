import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  AnimeCatalogStatus,
  AnimeListStatus,
} from '@prisma/client';

import type {
  PrismaService,
} from '../database/prisma.service.js';

import {
  UserStatisticsService,
} from './user-statistics.service.js';

const USER_ID =
  '11111111-1111-4111-8111-111111111111';

function createScore(
  value: number,
) {
  return {
    toNumber: () =>
      value,
  };
}

function createGenre(
  id: string,
  slug: string,
  name: string,
) {
  return {
    genre: {
      id,
      slug,
      name,
    },
  };
}

function createEntry({
  status =
    AnimeListStatus.WATCHING,
  progressEpisodes = 0,
  score = null,
  rewatchCount = 0,
  genres = [],
}: {
  status?: AnimeListStatus;
  progressEpisodes?: number;
  score?: ReturnType<
    typeof createScore
  > | null;
  rewatchCount?: number;
  genres?: ReturnType<
    typeof createGenre
  >[];
} = {}) {
  return {
    status,
    progressEpisodes,
    score,
    rewatchCount,

    anime: {
      genres,
    },
  };
}

describe(
  'UserStatisticsService',
  () => {
    it(
      'returns null for an invalid username without querying the database',
      async () => {
        const findUnique =
          jest.fn();

        const prisma = {
          user: {
            findUnique,
          },
        } as unknown as PrismaService;

        const service =
          new UserStatisticsService(
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
      'returns null when the requested user does not exist',
      async () => {
        const findUnique =
          jest.fn(
            async (
              _args: unknown,
            ) =>
              null,
          );

        const findMany =
          jest.fn();

        const count =
          jest.fn();

        const prisma = {
          user: {
            findUnique,
          },

          animeListEntry: {
            findMany,
          },

          animeFavorite: {
            count,
          },
        } as unknown as PrismaService;

        const service =
          new UserStatisticsService(
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

        expect(
          findMany,
        ).not.toHaveBeenCalled();

        expect(
          count,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'returns zeroed statistics for a user with no tracking or favorites',
      async () => {
        const prisma = {
          user: {
            findUnique:
              jest.fn(
                async (
                  _args: unknown,
                ) => ({
                  id:
                    USER_ID,

                  username:
                    'test_user',
                }),
              ),
          },

          animeListEntry: {
            findMany:
              jest.fn(
                async (
                  _args: unknown,
                ) => [],
              ),
          },

          animeFavorite: {
            count:
              jest.fn(
                async (
                  _args: unknown,
                ) => 0,
              ),
          },
        } as unknown as PrismaService;

        const service =
          new UserStatisticsService(
            prisma,
          );

        const result =
          await service.findPublic(
            'test_user',
          );

        expect(
          result,
        ).toEqual({
          username:
            'test_user',

          totalTracked: 0,

          planning: 0,
          watching: 0,
          completed: 0,
          paused: 0,
          dropped: 0,
          rewatching: 0,

          episodesLogged: 0,
          totalRewatches: 0,

          scoredAnime: 0,
          meanScore: null,

          favoriteAnimeCount: 0,

          topGenres: [],
        });
      },
    );

    it(
      'aggregates status, progress, rewatches, scores, favorites, and genres',
      async () => {
        const action =
          createGenre(
            'genre-action',
            'action',
            'Action',
          );

        const comedy =
          createGenre(
            'genre-comedy',
            'comedy',
            'Comedy',
          );

        const drama =
          createGenre(
            'genre-drama',
            'drama',
            'Drama',
          );

        const fantasy =
          createGenre(
            'genre-fantasy',
            'fantasy',
            'Fantasy',
          );

        const entries = [
          createEntry({
            status:
              AnimeListStatus
                .PLANNING,

            genres: [
              action,
            ],
          }),

          createEntry({
            status:
              AnimeListStatus
                .WATCHING,

            progressEpisodes: 3,

            score:
              createScore(
                8.5,
              ),

            genres: [
              action,
              comedy,
            ],
          }),

          createEntry({
            status:
              AnimeListStatus
                .COMPLETED,

            progressEpisodes: 12,

            score:
              createScore(
                9.5,
              ),

            rewatchCount: 1,

            genres: [
              action,
              drama,
            ],
          }),

          createEntry({
            status:
              AnimeListStatus
                .PAUSED,

            progressEpisodes: 4,

            genres: [
              comedy,
            ],
          }),

          createEntry({
            status:
              AnimeListStatus
                .DROPPED,

            progressEpisodes: 2,

            score:
              createScore(
                6.5,
              ),

            genres: [
              drama,
            ],
          }),

          createEntry({
            status:
              AnimeListStatus
                .REWATCHING,

            progressEpisodes: 1,

            rewatchCount: 2,

            genres: [
              fantasy,
            ],
          }),
        ];

        const prisma = {
          user: {
            findUnique:
              jest.fn(
                async (
                  _args: unknown,
                ) => ({
                  id:
                    USER_ID,

                  username:
                    'test_user',
                }),
              ),
          },

          animeListEntry: {
            findMany:
              jest.fn(
                async (
                  _args: unknown,
                ) =>
                  entries,
              ),
          },

          animeFavorite: {
            count:
              jest.fn(
                async (
                  _args: unknown,
                ) => 4,
              ),
          },
        } as unknown as PrismaService;

        const service =
          new UserStatisticsService(
            prisma,
          );

        const result =
          await service.findPublic(
            '  TEST_USER  ',
          );

        expect(
          result,
        ).toEqual({
          username:
            'test_user',

          totalTracked: 6,

          planning: 1,
          watching: 1,
          completed: 1,
          paused: 1,
          dropped: 1,
          rewatching: 1,

          episodesLogged: 22,
          totalRewatches: 3,

          scoredAnime: 3,
          meanScore: 8.17,

          favoriteAnimeCount: 4,

          topGenres: [
            {
              id:
                'genre-action',

              slug:
                'action',

              name:
                'Action',

              count: 3,
            },

            {
              id:
                'genre-comedy',

              slug:
                'comedy',

              name:
                'Comedy',

              count: 2,
            },

            {
              id:
                'genre-drama',

              slug:
                'drama',

              name:
                'Drama',

              count: 2,
            },

            {
              id:
                'genre-fantasy',

              slug:
                'fantasy',

              name:
                'Fantasy',

              count: 1,
            },
          ],
        });
      },
    );

    it(
      'queries tracking and favorites only from included anime',
      async () => {
        const findMany =
          jest.fn(
            async (
              _args: unknown,
            ) => [],
          );

        const count =
          jest.fn(
            async (
              _args: unknown,
            ) => 0,
          );

        const prisma = {
          user: {
            findUnique:
              jest.fn(
                async (
                  _args: unknown,
                ) => ({
                  id:
                    USER_ID,

                  username:
                    'test_user',
                }),
              ),
          },

          animeListEntry: {
            findMany,
          },

          animeFavorite: {
            count,
          },
        } as unknown as PrismaService;

        const service =
          new UserStatisticsService(
            prisma,
          );

        await service.findPublic(
          'test_user',
        );

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
          }),
        );

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
          },
        });
      },
    );

    it(
      'limits top genres to ten and sorts equal counts alphabetically',
      async () => {
        const genreNames = [
          'Kappa',
          'Alpha',
          'Lambda',
          'Beta',
          'Gamma',
          'Delta',
          'Epsilon',
          'Zeta',
          'Eta',
          'Theta',
          'Iota',
        ];

        const genres =
          genreNames.map(
            (
              name,
              index,
            ) =>
              createGenre(
                `genre-${index}`,
                name.toLowerCase(),
                name,
              ),
          );

        const prisma = {
          user: {
            findUnique:
              jest.fn(
                async (
                  _args: unknown,
                ) => ({
                  id:
                    USER_ID,

                  username:
                    'test_user',
                }),
              ),
          },

          animeListEntry: {
            findMany:
              jest.fn(
                async (
                  _args: unknown,
                ) => [
                  createEntry({
                    genres,
                  }),
                ],
              ),
          },

          animeFavorite: {
            count:
              jest.fn(
                async (
                  _args: unknown,
                ) => 0,
              ),
          },
        } as unknown as PrismaService;

        const service =
          new UserStatisticsService(
            prisma,
          );

        const result =
          await service.findPublic(
            'test_user',
          );

        expect(
          result?.topGenres,
        ).toHaveLength(
          10,
        );

        expect(
          result?.topGenres.map(
            (genre) =>
              genre.name,
          ),
        ).toEqual([
          'Alpha',
          'Beta',
          'Delta',
          'Epsilon',
          'Eta',
          'Gamma',
          'Iota',
          'Kappa',
          'Lambda',
          'Theta',
        ]);
      },
    );
  },
);
