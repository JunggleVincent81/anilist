import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import type {
  AchievementEvaluatorService,
} from './achievement-evaluator.service.js';

import {
  AchievementReconciliationService,
} from './achievement-reconciliation.service.js';

describe(
  'AchievementReconciliationService',
  () => {
    it(
      'reconciles the requested user',
      async () => {
        const evaluateUser =
          jest.fn(
            async (
              _userId: string,
            ) => ({
              evaluatedAchievements:
                17,

              newlyUnlocked:
                1,

              totalUnlocked:
                1,
            }),
          );

        const evaluator = {
          evaluateUser,
        } as unknown as
          AchievementEvaluatorService;

        const service =
          new AchievementReconciliationService(
            evaluator,
          );

        await expect(
          service.reconcileUser(
            'user-1',
          ),
        ).resolves.toBeUndefined();

        expect(
          evaluateUser,
        ).toHaveBeenCalledWith(
          'user-1',
        );
      },
    );

    it(
      'does not fail the parent mutation when evaluation fails',
      async () => {
        const evaluator = {
          evaluateUser:
            jest.fn(
              async (
                _userId:
                  string,
              ) => {
                throw new Error(
                  'temporary failure',
                );
              },
            ),
        } as unknown as
          AchievementEvaluatorService;

        const service =
          new AchievementReconciliationService(
            evaluator,
          );

        await expect(
          service.reconcileUser(
            'user-1',
          ),
        ).resolves.toBeUndefined();
      },
    );
  },
);
