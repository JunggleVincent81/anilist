import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  ACHIEVEMENT_CATALOG,
} from './achievement.catalog.js';

describe(
  'ACHIEVEMENT_CATALOG',
  () => {
    it(
      'contains unique stable codes',
      () => {
        const codes =
          ACHIEVEMENT_CATALOG.map(
            (achievement) =>
              achievement.code,
          );

        expect(
          new Set(codes).size,
        ).toBe(
          codes.length,
        );
      },
    );

    it(
      'uses positive thresholds',
      () => {
        for (
          const achievement
          of ACHIEVEMENT_CATALOG
        ) {
          expect(
            achievement.threshold,
          ).toBeGreaterThan(0);
        }
      },
    );

    it(
      'uses unique sort orders',
      () => {
        const sortOrders =
          ACHIEVEMENT_CATALOG.map(
            (achievement) =>
              achievement.sortOrder,
          );

        expect(
          new Set(
            sortOrders,
          ).size,
        ).toBe(
          sortOrders.length,
        );
      },
    );

    it(
      'contains the initial phase 9 catalog',
      () => {
        expect(
          ACHIEVEMENT_CATALOG,
        ).toHaveLength(17);
      },
    );
  },
);
