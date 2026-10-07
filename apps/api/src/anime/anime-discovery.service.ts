import {
  Injectable,
} from '@nestjs/common';

import type {
  Prisma,
} from '@prisma/client';

import {
  PrismaService,
} from '../database/prisma.service.js';

import {
  AnimeDiscoverySort,
} from './anime-discovery.graphql.js';

import type {
  AnimeDiscoveryInput,
  AnimeDiscoveryResultType,
} from './anime-discovery.graphql.js';

const animeDiscoverySelect = {
  id: true,
  slug: true,
  title: true,

  format: true,
  status: true,

  episodes: true,

  season: true,
  seasonYear: true,

  coverImageUrl: true,
} satisfies Prisma.AnimeSelect;

@Injectable()
export class AnimeDiscoveryService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  async discover(
    input?:
      AnimeDiscoveryInput,
  ): Promise<AnimeDiscoveryResultType> {
    const page =
      input?.page ?? 1;

    const perPage =
      input?.perPage ?? 20;

    const sort =
      input?.sort ??
      AnimeDiscoverySort
        .TITLE_ASC;

    const skip =
      (page - 1) *
      perPage;

    const where =
      this.buildWhere(
        input,
      );

    const orderBy =
      this.buildOrderBy(
        sort,
      );

    const [
      total,
      items,
    ] =
      await this.prisma
        .$transaction([
          this.prisma
            .anime
            .count({
              where,
            }),

          this.prisma
            .anime
            .findMany({
              where,

              select:
                animeDiscoverySelect,

              skip,

              take:
                perPage,

              orderBy,
            }),
        ]);

    const pageCount =
      total === 0
        ? 0
        : Math.ceil(
            total /
              perPage,
          );

    return {
      items,

      pageInfo: {
        page,
        perPage,

        total,
        pageCount,

        hasNextPage:
          page <
          pageCount,

        hasPreviousPage:
          page > 1,
      },
    };
  }

  private buildWhere(
    input?:
      AnimeDiscoveryInput,
  ): Prisma.AnimeWhereInput {
    if (!input) {
      return {};
    }

    const filters:
      Prisma.AnimeWhereInput[] =
      [];

    const search =
      input.search
        ?.trim()
        .replace(
          /\s+/g,
          ' ',
        );

    if (search) {
      filters.push({
        OR: [
          {
            title: {
              contains:
                search,

              mode:
                'insensitive',
            },
          },

          {
            titleRomaji: {
              contains:
                search,

              mode:
                'insensitive',
            },
          },

          {
            titleEnglish: {
              contains:
                search,

              mode:
                'insensitive',
            },
          },

          {
            titleNative: {
              contains:
                search,

              mode:
                'insensitive',
            },
          },

          {
            titles: {
              some: {
                value: {
                  contains:
                    search,

                  mode:
                    'insensitive',
                },
              },
            },
          },
        ],
      });
    }

    if (
      input.formats &&
      input.formats.length > 0
    ) {
      filters.push({
        format: {
          in:
            input.formats,
        },
      });
    }

    if (
      input.statuses &&
      input.statuses.length >
        0
    ) {
      filters.push({
        status: {
          in:
            input.statuses,
        },
      });
    }

    if (
      input.seasons &&
      input.seasons.length >
        0
    ) {
      filters.push({
        season: {
          in:
            input.seasons,
        },
      });
    }

    if (
      input.seasonYear !==
      undefined
    ) {
      filters.push({
        seasonYear:
          input.seasonYear,
      });
    }

    const genreSlugs =
      this.normalizeSlugs(
        input.genreSlugs,
      );

    if (
      genreSlugs.length > 0
    ) {
      filters.push({
        genres: {
          some: {
            genre: {
              slug: {
                in:
                  genreSlugs,
              },
            },
          },
        },
      });
    }

    const tagSlugs =
      this.normalizeSlugs(
        input.tagSlugs,
      );

    if (
      tagSlugs.length > 0
    ) {
      filters.push({
        tags: {
          some: {
            tag: {
              slug: {
                in:
                  tagSlugs,
              },
            },
          },
        },
      });
    }

    const studioSlugs =
      this.normalizeSlugs(
        input.studioSlugs,
      );

    if (
      studioSlugs.length >
      0
    ) {
      filters.push({
        studios: {
          some: {
            studio: {
              slug: {
                in:
                  studioSlugs,
              },
            },
          },
        },
      });
    }

    if (
      filters.length === 0
    ) {
      return {};
    }

    return {
      AND: filters,
    };
  }

  private buildOrderBy(
    sort:
      AnimeDiscoverySort,
  ): Prisma.AnimeOrderByWithRelationInput[] {
    switch (sort) {
      case AnimeDiscoverySort
        .TITLE_DESC:
        return [
          {
            title:
              'desc',
          },

          {
            id:
              'asc',
          },
        ];

      case AnimeDiscoverySort
        .START_DATE_ASC:
        return [
          {
            startDate: {
              sort:
                'asc',

              nulls:
                'last',
            },
          },

          {
            title:
              'asc',
          },

          {
            id:
              'asc',
          },
        ];

      case AnimeDiscoverySort
        .START_DATE_DESC:
        return [
          {
            startDate: {
              sort:
                'desc',

              nulls:
                'last',
            },
          },

          {
            title:
              'asc',
          },

          {
            id:
              'asc',
          },
        ];

      case AnimeDiscoverySort
        .SEASON_YEAR_ASC:
        return [
          {
            seasonYear: {
              sort:
                'asc',

              nulls:
                'last',
            },
          },

          {
            title:
              'asc',
          },

          {
            id:
              'asc',
          },
        ];

      case AnimeDiscoverySort
        .SEASON_YEAR_DESC:
        return [
          {
            seasonYear: {
              sort:
                'desc',

              nulls:
                'last',
            },
          },

          {
            title:
              'asc',
          },

          {
            id:
              'asc',
          },
        ];

      case AnimeDiscoverySort
        .TITLE_ASC:
      default:
        return [
          {
            title:
              'asc',
          },

          {
            id:
              'asc',
          },
        ];
    }
  }

  private normalizeSlugs(
    values:
      string[] |
      undefined,
  ): string[] {
    if (!values) {
      return [];
    }

    return [
      ...new Set(
        values
          .map(
            (value) =>
              value
                .trim()
                .toLowerCase(),
          )
          .filter(
            Boolean,
          ),
      ),
    ];
  }
}