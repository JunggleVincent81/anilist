import {
  Injectable,
} from '@nestjs/common';

import {
  AnimeCatalogStatus,
  AnimeDataProvider,
  Prisma,
} from '@prisma/client';

import {
  PrismaService,
} from '../database/prisma.service.js';

import {
  AniListAiringClient,
} from './anilist-airing.client.js';

import type {
  AniListAiringItem,
} from './anilist-airing.client.js';

import type {
  AiringScheduleResultType,
} from './airing-schedule.graphql.js';

import {
  AiringScheduleValidationError,
} from './airing-schedule.errors.js';

const DAY_MS =
  24 * 60 * 60 * 1000;

const CACHE_TTL_MS =
  5 * 60 * 1000;

const animeSummarySelect = {
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

type AnimeSummaryRecord =
  Prisma.AnimeGetPayload<{
    select:
      typeof animeSummarySelect;
  }>;

type CacheEntry = {
  expiresAt: number;

  result:
    AiringScheduleResultType;
};

@Injectable()
export class AiringScheduleService {
  private readonly cache =
    new Map<
      number,
      CacheEntry
    >();

  constructor(
    private readonly prisma:
      PrismaService,

    private readonly anilist:
      AniListAiringClient,
  ) {}

  async findUpcoming(
    days = 7,
    now = new Date(),
  ): Promise<
    AiringScheduleResultType
  > {
    this.validateDays(days);

    const cached =
      this.cache.get(days);

    if (
      cached &&
      cached.expiresAt >
        now.getTime()
    ) {
      return cached.result;
    }

    const rangeStart =
      new Date(
        now.getTime(),
      );

    const rangeEnd =
      new Date(
        now.getTime() +
          days * DAY_MS,
      );

    const upstreamItems =
      await this.anilist
        .findUpcoming(
          Math.floor(
            rangeStart.getTime() /
              1000,
          ),

          Math.floor(
            rangeEnd.getTime() /
              1000,
          ),
        );

    const result =
      await this.mapCanonical(
        upstreamItems,
        rangeStart,
        rangeEnd,
        now,
      );

    this.cache.set(
      days,
      {
        expiresAt:
          now.getTime() +
          CACHE_TTL_MS,

        result,
      },
    );

    return result;
  }

  private validateDays(
    days: number,
  ): void {
    if (
      !Number.isInteger(
        days,
      ) ||
      days < 1 ||
      days > 14
    ) {
      throw new AiringScheduleValidationError(
        'Schedule range must be between 1 and 14 days.',
      );
    }
  }

  private async mapCanonical(
    upstreamItems:
      AniListAiringItem[],

    rangeStart: Date,
    rangeEnd: Date,
    generatedAt: Date,
  ): Promise<
    AiringScheduleResultType
  > {
    if (
      upstreamItems.length === 0
    ) {
      return {
        generatedAt,
        rangeStart,
        rangeEnd,
        items: [],
      };
    }

    const externalIds = [
      ...new Set(
        upstreamItems.map(
          (item) =>
            String(
              item.mediaId,
            ),
        ),
      ),
    ];

    const links =
      await this.prisma
        .externalAnimeId
        .findMany({
          where: {
            provider:
              AnimeDataProvider
                .ANILIST,

            externalId: {
              in:
                externalIds,
            },

            anime: {
              catalogStatus:
                AnimeCatalogStatus
                  .INCLUDED,
            },
          },

          select: {
            externalId:
              true,

            anime: {
              select:
                animeSummarySelect,
            },
          },
        });

    const animeByExternalId =
      new Map<
        string,
        AnimeSummaryRecord
      >(
        links.map(
          (link) => [
            link.externalId,
            link.anime,
          ],
        ),
      );

    const items =
      upstreamItems
        .flatMap(
          (item) => {
            const anime =
              animeByExternalId
                .get(
                  String(
                    item.mediaId,
                  ),
                );

            if (!anime) {
              return [];
            }

            return [
              {
                airingAt:
                  new Date(
                    item.airingAt *
                      1000,
                  ),

                episode:
                  item.episode,

                anime,
              },
            ];
          },
        )
        .sort(
          (
            first,
            second,
          ) => {
            const timeDifference =
              first.airingAt
                .getTime() -
              second.airingAt
                .getTime();

            if (
              timeDifference !==
              0
            ) {
              return (
                timeDifference
              );
            }

            const titleDifference =
              first.anime.title
                .localeCompare(
                  second
                    .anime
                    .title,
                );

            if (
              titleDifference !==
              0
            ) {
              return (
                titleDifference
              );
            }

            return (
              first.episode -
              second.episode
            );
          },
        );

    return {
      generatedAt,
      rangeStart,
      rangeEnd,
      items,
    };
  }
}
