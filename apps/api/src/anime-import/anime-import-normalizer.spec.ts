import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  AnimeFormat,
  AnimeReleaseStatus,
  AnimeSeason,
} from '@prisma/client';

import {
  createSlug,
  normalizeAnimeRecord,
} from './anime-import-normalizer.js';

describe(
  'anime import normalizer',
  () => {
    it('normalizes a dataset anime', () => {
      const result =
        normalizeAnimeRecord(
          {
            sources: [
              'https://myanimelist.net/anime/1',
              'https://anilist.co/anime/1',
            ],

            title:
              'Cowboy Bebop',

            type: 'TV',
            episodes: 26,

            status:
              'FINISHED',

            animeSeason: {
              season:
                'SPRING',
              year: 1998,
            },

            duration: {
              value: 1440,
              unit:
                'SECONDS',
            },

            synonyms: [
              'カウボーイビバップ',
            ],

            studios: [
              'sunrise',
            ],

            producers: [
              'bandai visual',
            ],

            relatedAnime: [],

            tags: [
              'action',
              'space',
            ],
          },
          2,
        );

      expect(
        result.title,
      ).toBe(
        'Cowboy Bebop',
      );

      expect(
        result.format,
      ).toBe(
        AnimeFormat.TV,
      );

      expect(
        result.status,
      ).toBe(
        AnimeReleaseStatus
          .FINISHED,
      );

      expect(
        result.season,
      ).toBe(
        AnimeSeason.SPRING,
      );

      expect(
        result.seasonYear,
      ).toBe(1998);

      expect(
        result.durationMinutes,
      ).toBe(24);

      expect(
        result.externalIds,
      ).toHaveLength(2);
    });

    it('maps zero episodes to unknown', () => {
      const result =
        normalizeAnimeRecord(
          {
            sources: [
              'https://myanimelist.net/anime/2',
            ],

            title:
              'Upcoming Anime',

            type:
              'UNKNOWN',

            episodes: 0,

            status:
              'UPCOMING',

            animeSeason: {
              season:
                'UNDEFINED',

              year: null,
            },

            synonyms: [],
            studios: [],
            producers: [],
            relatedAnime: [],
            tags: [],
          },
          2,
        );

      expect(
        result.episodes,
      ).toBeNull();

      expect(
        result.season,
      ).toBeNull();

      expect(
        result.status,
      ).toBe(
        AnimeReleaseStatus
          .UPCOMING,
      );
    });

    it('creates deterministic slugs', () => {
      expect(
        createSlug(
          'Frieren: Beyond Journey’s End',
          220,
          'anime',
        ),
      ).toBe(
        'frieren-beyond-journey-s-end',
      );
    });
  },
);