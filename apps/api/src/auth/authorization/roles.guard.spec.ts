import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import type {
  ExecutionContext,
} from '@nestjs/common';
import type {
  Reflector,
} from '@nestjs/core';

import {
  RolesGuard,
} from './roles.guard.js';
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

function createReflector(
  roles:
    | (
        | 'USER'
        | 'MODERATOR'
        | 'ADMIN'
      )[]
    | undefined,
): Reflector {
  return {
    getAllAndOverride:
      jest.fn()
        .mockReturnValue(
          roles,
        ),
  } as unknown as Reflector;
}

const authenticatedUser = {
  id: 'user-id',
  email: 'user@example.com',
  username: 'test_user',
  displayName: null,
  bio: null,
  avatarUrl: null,
  role: 'USER' as const,
};

describe('RolesGuard', () => {
  it('allows access when no role metadata exists', () => {
    const guard =
      new RolesGuard(
        createReflector(
          undefined,
        ),
      );

    expect(
      guard.canActivate(
        createExecutionContext({
          currentUser: null,
          currentSession: null,
        }),
      ),
    ).toBe(true);
  });

  it('rejects anonymous users on protected role routes', () => {
    const guard =
      new RolesGuard(
        createReflector([
          'ADMIN',
        ]),
      );

    try {
      guard.canActivate(
        createExecutionContext({
          currentUser: null,
          currentSession: null,
        }),
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

  it('rejects authenticated users without the required role', () => {
    const guard =
      new RolesGuard(
        createReflector([
          'ADMIN',
        ]),
      );

    try {
      guard.canActivate(
        createExecutionContext({
          currentUser:
            authenticatedUser,
        }),
      );

      throw new Error(
        'Expected guard to throw.',
      );
    } catch (error) {
      expect(error).toMatchObject({
        message:
          'You do not have permission to perform this action.',
        extensions: {
          code: 'FORBIDDEN',
        },
      });
    }
  });

  it('allows users with an accepted role', () => {
    const guard =
      new RolesGuard(
        createReflector([
          'USER',
          'ADMIN',
        ]),
      );

    expect(
      guard.canActivate(
        createExecutionContext({
          currentUser:
            authenticatedUser,
        }),
      ),
    ).toBe(true);
  });
});