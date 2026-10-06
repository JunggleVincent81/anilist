import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import type {
  Request,
  Response,
} from 'express';

import type {
  PrismaService,
} from '../database/prisma.service.js';
import {
  AuthContextService,
} from './auth-context.service.js';
import {
  hashSessionToken,
} from './security/session.security.js';

type SessionLookupResult = {
  id: string;
  expiresAt: Date;
  revokedAt: Date | null;

  user: {
    id: string;
    email: string;
    username: string;
    displayName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    role: 'USER';
  };
} | null;

function createRequest(
  cookie?: string,
): Request {
  return {
    headers: {
      cookie,
    },
  } as Request;
}

function createResponse():
  Response {
  return {} as Response;
}

function createService(
  result:
    SessionLookupResult,
) {
  const findUnique =
    jest.fn<
      (
        args: unknown,
      ) =>
        Promise<
          SessionLookupResult
        >
    >()
      .mockResolvedValue(result);

  const prisma = {
    session: {
      findUnique,
    },
  } as unknown as PrismaService;

  return {
    service:
      new AuthContextService(
        prisma,
      ),

    findUnique,
  };
}

const user = {
  id: 'user-id',
  email: 'user@example.com',
  username: 'test_user',
  displayName: null,
  bio: null,
  avatarUrl: null,
  role: 'USER' as const,
};

describe(
  'AuthContextService',
  () => {
    it('returns anonymous context without a cookie', async () => {
      const {
        service,
        findUnique,
      } = createService(null);

      const context =
        await service
          .createContext(
            createRequest(),
            createResponse(),
          );

      expect(
        context.currentUser,
      ).toBeNull();

      expect(
        context.currentSession,
      ).toBeNull();

      expect(
        findUnique,
      ).not.toHaveBeenCalled();
    });

    it('returns anonymous context for an unknown token', async () => {
      const {
        service,
        findUnique,
      } = createService(null);

      const token =
        'unknown-session-token';

      const context =
        await service
          .createContext(
            createRequest(
              `anilist_session=${token}`,
            ),
            createResponse(),
          );

      expect(
        context.currentUser,
      ).toBeNull();

      expect(
        context.currentSession,
      ).toBeNull();

      expect(
        findUnique,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tokenHash:
              hashSessionToken(
                token,
              ),
          },
        }),
      );
    });

    it('rejects a revoked session', async () => {
      const {
        service,
      } = createService({
        id: 'session-id',
        expiresAt:
          new Date(
            Date.now() +
              60_000,
          ),

        revokedAt:
          new Date(),

        user,
      });

      const context =
        await service
          .createContext(
            createRequest(
              'anilist_session=token',
            ),
            createResponse(),
          );

      expect(
        context.currentUser,
      ).toBeNull();
    });

    it('rejects an expired session', async () => {
      const {
        service,
      } = createService({
        id: 'session-id',

        expiresAt:
          new Date(
            Date.now() -
              60_000,
          ),

        revokedAt: null,
        user,
      });

      const context =
        await service
          .createContext(
            createRequest(
              'anilist_session=token',
            ),
            createResponse(),
          );

      expect(
        context.currentUser,
      ).toBeNull();
    });

    it('returns the user for a valid session', async () => {
      const expiresAt =
        new Date(
          Date.now() +
            60_000,
        );

      const {
        service,
      } = createService({
        id: 'session-id',
        expiresAt,
        revokedAt: null,
        user,
      });

      const context =
        await service
          .createContext(
            createRequest(
              'anilist_session=token',
            ),
            createResponse(),
          );

      expect(
        context.currentUser,
      ).toEqual(user);

      expect(
        context.currentSession,
      ).toEqual({
        id: 'session-id',
        expiresAt,
      });
    });
  },
);