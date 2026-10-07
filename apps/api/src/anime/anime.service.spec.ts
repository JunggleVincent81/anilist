import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  AnimeCatalogStatus,
  AnimeFormat,
  AnimeRelationType,
  AnimeReleaseStatus,
  AnimeSourceMaterial,
} from '@prisma/client';

import type {
  PrismaService,
} from '../database/prisma.service.js';

import {
  AnimeRelationDisplayType,
} from './anime.graphql.js';

import {
  AnimeService,
} from './anime.service.js';

function createAnimeRecord() {
  return {
    id:
      '11111111-1111-4111-8111-111111111111',

    slug:
      'example-anime',

    title:
      'Example Anime',

    titleRomaji: null,
    titleEnglish: null,
    titleNative: null,

    description: null,

    format:
      AnimeFormat.TV,

    status:
      AnimeReleaseStatus.FINISHED,

    sourceMaterial:
      AnimeSourceMaterial.UNKNOWN,

    episodes: 12,
    durationMinutes: 24,

    season: null,
    seasonYear: 2025,

    startDate: null,
    endDate: null,

    coverImageUrl: null,
    bannerImageUrl: null,

    isAdult: null,

    catalogStatus:
      AnimeCatalogStatus.INCLUDED,

    createdAt:
      new Date(
        '2025-01-01T00:00:00.000Z',
      ),

    updatedAt:
      new Date(
        '2025-01-01T00:00:00.000Z',
      ),

    titles: [],
    externalIds: [],
    genres: [],
    tags: [],
    studios: [],

    relationsFrom: [
      {
        type:
          AnimeRelationType.SEQUEL,

        targetAnime: {
          id:
            '22222222-2222-4222-8222-222222222222',

          slug:
            'example-anime-season-2',

          title:
            'Example Anime Season 2',

          format:
            AnimeFormat.TV,

          status:
            AnimeReleaseStatus.UPCOMING,

          episodes: null,
          season: null,
          seasonYear: 2026,
          coverImageUrl: null,
        },
      },
    ],

    relationsTo: [
      {
        type:
          AnimeRelationType.SEQUEL,

        sourceAnime: {
          id:
            '33333333-3333-4333-8333-333333333333',

          slug:
            'example-anime-prequel',

          title:
            'Example Anime Prequel',

          format:
            AnimeFormat.TV,

          status:
            AnimeReleaseStatus.FINISHED,

          episodes: 12,
          season: null,
          seasonYear: 2024,
          coverImageUrl: null,
        },
      },
    ],
  };
}

describe(
  'AnimeService',
  () => {
    it(
      'returns null for an invalid UUID without querying Prisma',
      async () => {
        const findFirst =
          jest.fn();

        const prisma = {
          anime: {
            findFirst,
          },
        } as unknown as PrismaService;

        const service =
          new AnimeService(
            prisma,
          );

        await expect(
          service.findById(
            'invalid-id',
          ),
        ).resolves.toBeNull();

        expect(
          findFirst,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'returns anime by slug',
      async () => {
        const findFirst =
          jest.fn(
            async (_args: unknown) =>
              createAnimeRecord(),
          );

        const prisma = {
          anime: {
            findFirst,
          },
        } as unknown as PrismaService;

        const service =
          new AnimeService(
            prisma,
          );

        const anime =
          await service.findBySlug(
            ' Example-Anime ',
          );

        expect(
          findFirst,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            where:
              expect.objectContaining({
                slug:
                  'example-anime',

                catalogStatus:
                  AnimeCatalogStatus
                    .INCLUDED,
              }),
          }),
        );

        expect(
          anime?.title,
        ).toBe(
          'Example Anime',
        );
      },
    );

    it(
      'only queries included anime by id',
      async () => {
        const findFirst =
          jest.fn(
            async (_args: unknown) =>
              createAnimeRecord(),
          );

        const prisma = {
          anime: {
            findFirst,
          },
        } as unknown as PrismaService;

        const service =
          new AnimeService(
            prisma,
          );

        const anime =
          await service.findById(
            '11111111-1111-4111-8111-111111111111',
          );

        expect(
          findFirst,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            where:
              expect.objectContaining({
                id:
                  '11111111-1111-4111-8111-111111111111',

                catalogStatus:
                  AnimeCatalogStatus
                    .INCLUDED,
              }),
          }),
        );

        expect(
          anime?.title,
        ).toBe(
          'Example Anime',
        );
      },
    );

    it(
      'maps directional relations for the API',
      async () => {
        const findFirst =
          jest.fn(
            async (_args: unknown) =>
              createAnimeRecord(),
          );

        const prisma = {
          anime: {
            findFirst,
          },
        } as unknown as PrismaService;

        const service =
          new AnimeService(
            prisma,
          );

        const anime =
          await service.findBySlug(
            'example-anime',
          );

        expect(
          findFirst,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            where:
              expect.objectContaining({
                slug:
                  'example-anime',

                catalogStatus:
                  AnimeCatalogStatus
                    .INCLUDED,
              }),
          }),
        );

        expect(
          anime?.relations,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              type:
                AnimeRelationDisplayType
                  .SEQUEL,
            }),

            expect.objectContaining({
              type:
                AnimeRelationDisplayType
                  .PREQUEL,
            }),
          ]),
        );
      },
    );
  },
);