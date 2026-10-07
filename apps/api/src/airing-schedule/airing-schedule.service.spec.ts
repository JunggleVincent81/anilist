import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  AnimeCatalogStatus,
  AnimeDataProvider,
  AnimeFormat,
  AnimeReleaseStatus,
  AnimeSeason,
} from '@prisma/client';

import type {
  PrismaService,
} from '../database/prisma.service.js';

import type {
  AniListAiringClient,
} from './anilist-airing.client.js';

import {
  AiringScheduleService,
} from './airing-schedule.service.js';

import {
  AiringScheduleValidationError,
} from './airing-schedule.errors.js';

const NOW =
  new Date(
    '2026-10-07T12:00:00.000Z',
  );

function createAnime(
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
        .AIRING,

    episodes: 12,

    season:
      AnimeSeason.FALL,

    seasonYear: 2026,

    coverImageUrl:
      null,
  };
}

describe(
  'AiringScheduleService',
  () => {
    it(
      'rejects an invalid day range',
      async () => {
        const prisma =
          {} as PrismaService;

        const anilist =
          {} as
            AniListAiringClient;

        const service =
          new AiringScheduleService(
            prisma,
            anilist,
          );

        await expect(
          service.findUpcoming(
            15,
            NOW,
          ),
        ).rejects.toBeInstanceOf(
          AiringScheduleValidationError,
        );
      },
    );

    it(
      'returns an empty result without querying local ids when upstream is empty',
      async () => {
        const findMany =
          jest.fn();

        const prisma = {
          externalAnimeId: {
            findMany,
          },
        } as unknown as
          PrismaService;

        const findUpcoming =
          jest.fn(
            async () => [],
          );

        const anilist = {
          findUpcoming,
        } as unknown as
          AniListAiringClient;

        const service =
          new AiringScheduleService(
            prisma,
            anilist,
          );

        const result =
          await service
            .findUpcoming(
              7,
              NOW,
            );

        expect(
          result.items,
        ).toEqual([]);

        expect(
          findMany,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'maps AniList media ids only to included canonical anime and sorts by airing time',
      async () => {
        const firstAnime =
          createAnime(
            '11111111-1111-4111-8111-111111111111',
            'Anime A',
          );

        const secondAnime =
          createAnime(
            '22222222-2222-4222-8222-222222222222',
            'Anime B',
          );

        const findMany =
          jest.fn(
            async (
              _args: unknown,
            ) => [
              {
                externalId:
                  '100',

                anime:
                  firstAnime,
              },

              {
                externalId:
                  '200',

                anime:
                  secondAnime,
              },
            ],
          );

        const prisma = {
          externalAnimeId: {
            findMany,
          },
        } as unknown as
          PrismaService;

        const findUpcoming =
          jest.fn(
            async () => [
              {
                id: 2,
                mediaId: 200,
                episode: 8,
                airingAt:
                  1791381600,
              },

              {
                id: 1,
                mediaId: 100,
                episode: 4,
                airingAt:
                  1791378000,
              },

              {
                id: 3,
                mediaId: 999,
                episode: 2,
                airingAt:
                  1791385200,
              },
            ],
          );

        const anilist = {
          findUpcoming,
        } as unknown as
          AniListAiringClient;

        const service =
          new AiringScheduleService(
            prisma,
            anilist,
          );

        const result =
          await service
            .findUpcoming(
              7,
              NOW,
            );

        expect(
          findMany,
        ).toHaveBeenCalledWith({
          where: {
            provider:
              AnimeDataProvider
                .ANILIST,

            externalId: {
              in: [
                '200',
                '100',
                '999',
              ],
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
                expect.any(
                  Object,
                ),
            },
          },
        });

        expect(
          result.items.map(
            (item) => ({
              title:
                item.anime
                  .title,

              episode:
                item.episode,
            }),
          ),
        ).toEqual([
          {
            title:
              'Anime A',

            episode: 4,
          },

          {
            title:
              'Anime B',

            episode: 8,
          },
        ]);
      },
    );

    it(
      'uses the short-lived cache for identical ranges',
      async () => {
        const findMany =
          jest.fn(
            async (
              _args: unknown,
            ) => [],
          );

        const prisma = {
          externalAnimeId: {
            findMany,
          },
        } as unknown as
          PrismaService;

        const findUpcoming =
          jest.fn(
            async () => [
              {
                id: 1,
                mediaId: 100,
                episode: 1,
                airingAt:
                  1791378000,
              },
            ],
          );

        const anilist = {
          findUpcoming,
        } as unknown as
          AniListAiringClient;

        const service =
          new AiringScheduleService(
            prisma,
            anilist,
          );

        await service
          .findUpcoming(
            7,
            NOW,
          );

        await service
          .findUpcoming(
            7,

            new Date(
              NOW.getTime() +
                60_000,
            ),
          );

        expect(
          findUpcoming,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          findMany,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );
  },
);
