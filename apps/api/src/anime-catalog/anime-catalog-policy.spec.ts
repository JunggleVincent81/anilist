import {
  AnimeCatalogStatus,
  AnimeFormat,
} from '@prisma/client';

import {
  classifyAnimeCatalog,
} from './anime-catalog-policy.js';

describe(
  'classifyAnimeCatalog',
  () => {
    it(
      'excludes visualizers',
      () => {
        const result =
          classifyAnimeCatalog({
            title:
              "'LEMONADE (Feat. Becky G)' Visualizer",
            format:
              AnimeFormat.SPECIAL,
            tags: [
              'music',
              'idols (female)',
            ],
          });

        expect(
          result.status,
        ).toBe(
          AnimeCatalogStatus.EXCLUDED,
        );

        expect(
          result.reason,
        ).toBe(
          'AUTO_TITLE_VISUALIZER',
        );
      },
    );

    it(
      'keeps TV music anime included',
      () => {
        const result =
          classifyAnimeCatalog({
            title:
              'BanG Dream! Example',
            format:
              AnimeFormat.TV,
            tags: [
              'music',
            ],
          });

        expect(
          result.status,
        ).toBe(
          AnimeCatalogStatus.INCLUDED,
        );
      },
    );

    it(
      'reviews music specials',
      () => {
        const result =
          classifyAnimeCatalog({
            title:
              'Animated Song',
            format:
              AnimeFormat.SPECIAL,
            tags: [
              'music',
            ],
          });

        expect(
          result.status,
        ).toBe(
          AnimeCatalogStatus.REVIEW,
        );
      },
    );

    it(
      'excludes commercial-tagged records',
      () => {
        const result =
          classifyAnimeCatalog({
            title:
              'Example Animation',
            format:
              AnimeFormat.ONA,
            tags: [
              'commercials',
            ],
          });

        expect(
          result.status,
        ).toBe(
          AnimeCatalogStatus.EXCLUDED,
        );
      },
    );

    it(
      'reviews unknown formats',
      () => {
        const result =
          classifyAnimeCatalog({
            title:
              'Unknown Work',
            format:
              AnimeFormat.UNKNOWN,
            tags: [],
          });

        expect(
          result.status,
        ).toBe(
          AnimeCatalogStatus.REVIEW,
        );
      },
    );

    it(
      'reviews promotional content',
      () => {
        const result =
          classifyAnimeCatalog({
            title:
              'Franchise Short',
            format:
              AnimeFormat.ONA,
            tags: [
              'promotional',
            ],
          });

        expect(
          result.status,
        ).toBe(
          AnimeCatalogStatus.REVIEW,
        );
      },
    );
  },
);