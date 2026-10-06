import {
  describe,
  expect,
  it,
} from '@jest/globals';
import type {
  ExecutionContext,
} from '@nestjs/common';

import {
  RequireAuthGuard,
} from './require-auth.guard.js';
import type {
  GraphQLAuthContext,
} from '../auth.types.js';

function createExecutionContext(
  authContext:
    Partial<GraphQLAuthContext>,
): ExecutionContext {
  return {
    getArgs: () => [
      undefined,
      undefined,
      authContext,
      undefined,
    ],

    getArgByIndex: (
      index: number,
    ) =>
      [
        undefined,
        undefined,
        authContext,
        undefined,
      ][index],

    getClass: () =>
      class TestResolver {},

    getHandler: () =>
      function testHandler() {},

    getType: () => 'graphql',
    switchToHttp: () =>
      undefined as never,
    switchToRpc: () =>
      undefined as never,
    switchToWs: () =>
      undefined as never,
  } as unknown as ExecutionContext;
}

describe(
  'RequireAuthGuard',
  () => {
    const guard =
      new RequireAuthGuard();

    it('rejects anonymous users', () => {
      const context =
        createExecutionContext({
          currentUser: null,
          currentSession: null,
        });

      try {
        guard.canActivate(
          context,
        );

        throw new Error(
          'Expected guard to throw.',
        );
      } catch (error) {
        expect(error).toMatchObject({
          message:
            'Authentication required.',
          extensions: {
            code:
              'UNAUTHENTICATED',
          },
        });
      }
    });

    it('allows authenticated users', () => {
      const context =
        createExecutionContext({
          currentUser: {
            id: 'user-id',
            email:
              'user@example.com',
            username:
              'test_user',
            displayName: null,
            bio: null,
            avatarUrl: null,
            role: 'USER',
          },

          currentSession: {
            id: 'session-id',
            expiresAt:
              new Date(
                Date.now() +
                  60_000,
              ),
          },
        });

      expect(
        guard.canActivate(
          context,
        ),
      ).toBe(true);
    });
  },
);