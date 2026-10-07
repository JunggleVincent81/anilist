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
  AnimeDiscoverySort,
} from './anime-discovery.graphql.js';

import {
  AnimeDiscoveryService,
} from './anime-discovery.service.js';

function createAnimeSummary(
  id: string,
  title: string,
) {
  return {
    id,

    slug:
      title
        .toLowerCase()
        .replace(
          /\s+/g,
          '-',
        ),

    title,

    format:
      AnimeFormat.TV,

    status:
      AnimeReleaseStatus
        .FINISHED,

    episodes: 12,

    season:
      AnimeSeason.SPRING,

    seasonYear: 2025,

    coverImageUrl: null,
  };
}

function createPrismaMock(
  total = 45,
) {
  const count =
    jest.fn(
      async (
        _args: unknown,
      ) =>
        total,
    );

  const findMany =
    jest.fn(
      async (
        _args: unknown,
      ) => [
        createAnimeSummary(
          '11111111-1111-4111-8111-111111111111',
          'Anime A',
        ),

        createAnimeSummary(
          '22222222-2222-4222-8222-222222222222',
          'Anime B',
        ),
      ],
    );

  const transaction =
    jest.fn(
      async (
        operations:
          Promise<unknown>[],
      ) =>
        Promise.all(
          operations,
        ),
    );

  const prisma = {
    anime: {
      count,
      findMany,
    },

    $transaction:
      transaction,
  } as unknown as PrismaService;

  return {
    prisma,
    count,
    findMany,
    transaction,
  };
}

describe(
  'AnimeDiscoveryService',
  () => {
    it(
      'uses default pagination and only included catalog anime',
      async () => {
        const {
          prisma,
          count,
          findMany,
        } =
          createPrismaMock(
            45,
          );

        const service =
          new AnimeDiscoveryService(
            prisma,
          );

        const result =
          await service
            .discover();

        expect(
          count,
        ).toHaveBeenCalledWith({
          where: {
              AND: [
                {
                  catalogStatus:
                    AnimeCatalogStatus
                      .INCLUDED,
                },
              ],
            },
        });

        expect(
          findMany,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              AND: [
                {
                  catalogStatus:
                    AnimeCatalogStatus
                      .INCLUDED,
                },
              ],
            },

            skip: 0,
            take: 20,
          }),
        );

        expect(
          result.pageInfo,
        ).toEqual({
          page: 1,
          perPage: 20,
          total: 45,
          pageCount: 3,
          hasNextPage: true,
          hasPreviousPage:
            false,
        });
      },
    );

    it(
      'calculates pagination offset',
      async () => {
        const {
          prisma,
          findMany,
        } =
          createPrismaMock(
            45,
          );

        const service =
          new AnimeDiscoveryService(
            prisma,
          );

        await service.discover({
          page: 3,
          perPage: 10,

          sort:
            AnimeDiscoverySort
              .TITLE_DESC,
        });

        expect(
          findMany,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            skip: 20,
            take: 10,

            orderBy: [
              {
                title:
                  'desc',
              },

              {
                id:
                  'asc',
              },
            ],
          }),
        );
      },
    );

    it(
      'builds search filter across canonical and alternate titles',
      async () => {
        const {
          prisma,
          count,
        } =
          createPrismaMock();

        const service =
          new AnimeDiscoveryService(
            prisma,
          );

        await service.discover({
          page: 1,
          perPage: 20,

          sort:
            AnimeDiscoverySort
              .TITLE_ASC,

          search:
            '  Attack   on Titan  ',
        });

        expect(
          count,
        ).toHaveBeenCalledWith({
          where: {
            AND: [
              {
                catalogStatus:
                  AnimeCatalogStatus
                    .INCLUDED,
              },

              {
                OR: [
                  {
                    title: {
                      contains:
                        'Attack on Titan',

                      mode:
                        'insensitive',
                    },
                  },

                  {
                    titleRomaji: {
                      contains:
                        'Attack on Titan',

                      mode:
                        'insensitive',
                    },
                  },

                  {
                    titleEnglish: {
                      contains:
                        'Attack on Titan',

                      mode:
                        'insensitive',
                    },
                  },

                  {
                    titleNative: {
                      contains:
                        'Attack on Titan',

                      mode:
                        'insensitive',
                    },
                  },

                  {
                    titles: {
                      some: {
                        value: {
                          contains:
                            'Attack on Titan',

                          mode:
                            'insensitive',
                        },
                      },
                    },
                  },
                ],
              },
            ],
          },
        });
      },
    );

    it(
      'combines metadata filters using AND',
      async () => {
        const {
          prisma,
          findMany,
        } =
          createPrismaMock();

        const service =
          new AnimeDiscoveryService(
            prisma,
          );

        await service.discover({
          page: 1,
          perPage: 20,

          sort:
            AnimeDiscoverySort
              .TITLE_ASC,

          formats: [
            AnimeFormat.TV,
            AnimeFormat.MOVIE,
          ],

          statuses: [
            AnimeReleaseStatus
              .FINISHED,
          ],

          seasons: [
            AnimeSeason.SPRING,
          ],

          seasonYear: 2025,

          genreSlugs: [
            'action',
          ],

          tagSlugs: [
            'drama',
          ],

          studioSlugs: [
            'mappa',
          ],
        });

        expect(
          findMany,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              AND: [
                {
                  catalogStatus:
                    AnimeCatalogStatus
                      .INCLUDED,
                },

                {
                  format: {
                    in: [
                      AnimeFormat.TV,
                      AnimeFormat.MOVIE,
                    ],
                  },
                },

                {
                  status: {
                    in: [
                      AnimeReleaseStatus
                        .FINISHED,
                    ],
                  },
                },

                {
                  season: {
                    in: [
                      AnimeSeason
                        .SPRING,
                    ],
                  },
                },

                {
                  seasonYear:
                    2025,
                },

                {
                  genres: {
                    some: {
                      genre: {
                        slug: {
                          in: [
                            'action',
                          ],
                        },
                      },
                    },
                  },
                },

                {
                  tags: {
                    some: {
                      tag: {
                        slug: {
                          in: [
                            'drama',
                          ],
                        },
                      },
                    },
                  },
                },

                {
                  studios: {
                    some: {
                      studio: {
                        slug: {
                          in: [
                            'mappa',
                          ],
                        },
                      },
                    },
                  },
                },
              ],
            },
          }),
        );
      },
    );

    it(
      'normalizes duplicate taxonomy slugs',
      async () => {
        const {
          prisma,
          count,
        } =
          createPrismaMock();

        const service =
          new AnimeDiscoveryService(
            prisma,
          );

        await service.discover({
          page: 1,
          perPage: 20,

          sort:
            AnimeDiscoverySort
              .TITLE_ASC,

          tagSlugs: [
            ' Drama ',
            'drama',
            'ACTION',
          ],
        });

        expect(
          count,
        ).toHaveBeenCalledWith({
          where: {
            AND: [
              {
                catalogStatus:
                  AnimeCatalogStatus
                    .INCLUDED,
              },

              {
                tags: {
                  some: {
                    tag: {
                      slug: {
                        in: [
                          'drama',
                          'action',
                        ],
                      },
                    },
                  },
                },
              },
            ],
          },
        });
      },
    );

    it(
      'returns empty pagination metadata correctly',
      async () => {
        const {
          prisma,
        } =
          createPrismaMock(
            0,
          );

        const service =
          new AnimeDiscoveryService(
            prisma,
          );

        const result =
          await service
            .discover();

        expect(
          result.pageInfo,
        ).toEqual({
          page: 1,
          perPage: 20,
          total: 0,
          pageCount: 0,
          hasNextPage: false,
          hasPreviousPage:
            false,
        });
      },
    );
  },
);