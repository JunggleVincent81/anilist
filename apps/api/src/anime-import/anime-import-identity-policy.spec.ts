import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  AnimeDataProvider,
} from '@prisma/client';

import {
  canMergeByExternalIdentity,
} from './anime-import-identity-policy.js';

describe(
  'anime import identity policy',
  () => {
    it.each([
      AnimeDataProvider.MAL,
      AnimeDataProvider.ANILIST,
      AnimeDataProvider.ANIDB,
      AnimeDataProvider.KITSU,
      AnimeDataProvider.ANIME_PLANET,
      AnimeDataProvider.LIVECHART,
      AnimeDataProvider.ANN,
    ])(
      'allows %s as canonical identity',
      (provider) => {
        expect(
          canMergeByExternalIdentity(
            provider,
          ),
        ).toBe(true);
      },
    );

    it.each([
      AnimeDataProvider.TMDB,
      AnimeDataProvider.IMDB,
      AnimeDataProvider.OTHER,
    ])(
      'does not allow %s to merge canonical anime',
      (provider) => {
        expect(
          canMergeByExternalIdentity(
            provider,
          ),
        ).toBe(false);
      },
    );
  },
);