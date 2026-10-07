import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  AnimeDataProvider,
} from '@prisma/client';

import {
  externalIdentityKey,
  parseExternalAnimeIdentity,
} from './anime-import-identity.js';

describe(
  'anime import identity',
  () => {
    it(
      'parses MyAnimeList IDs',
      () => {
        expect(
          parseExternalAnimeIdentity(
            'https://myanimelist.net/anime/52991',
          ),
        ).toMatchObject({
          provider:
            AnimeDataProvider.MAL,

          externalId:
            '52991',
        });
      },
    );

    it(
      'parses AniList IDs',
      () => {
        expect(
          parseExternalAnimeIdentity(
            'https://anilist.co/anime/154587',
          ),
        ).toMatchObject({
          provider:
            AnimeDataProvider.ANILIST,

          externalId:
            '154587',
        });
      },
    );

    it(
      'keeps unknown providers isolated',
      () => {
        const result =
          parseExternalAnimeIdentity(
            'https://example.org/anime/123',
          );

        expect(
          result?.provider,
        ).toBe(
          AnimeDataProvider.OTHER,
        );

        expect(
          result?.externalId,
        ).toContain(
          'example.org',
        );
      },
    );

    it(
      'keeps Anime News Network anime ids distinct',
      () => {
        const first =
          parseExternalAnimeIdentity(
            'https://animenewsnetwork.com/encyclopedia/anime.php?id=36229',
          );

        const second =
          parseExternalAnimeIdentity(
            'https://animenewsnetwork.com/encyclopedia/anime.php?id=1972',
          );

        expect(
          first,
        ).toEqual(
          expect.objectContaining({
            provider:
              AnimeDataProvider.ANN,

            externalId:
              '36229',
          }),
        );

        expect(
          second,
        ).toEqual(
          expect.objectContaining({
            provider:
              AnimeDataProvider.ANN,

            externalId:
              '1972',
          }),
        );

        expect(
          externalIdentityKey(
            first!,
          ),
        ).not.toBe(
          externalIdentityKey(
            second!,
          ),
        );
      },
    );

    it(
      'preserves query parameters for generic providers',
      () => {
        const first =
          parseExternalAnimeIdentity(
            'https://example.com/item?id=1',
          );

        const second =
          parseExternalAnimeIdentity(
            'https://example.com/item?id=2',
          );

        expect(
          externalIdentityKey(
            first!,
          ),
        ).not.toBe(
          externalIdentityKey(
            second!,
          ),
        );
      },
    );
  },
);