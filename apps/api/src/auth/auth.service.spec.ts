import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import type {
  PrismaService,
} from '../database/prisma.service.js';
import {
  AuthService,
} from './auth.service.js';
import {
  InvalidCredentialsError,
} from './auth.errors.js';
import {
  verifyPassword,
} from './security/password.security.js';

type UserCreateResult = {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  role: 'USER';
};

type LoginUserResult =
  UserCreateResult & {
    passwordHash: string;
  };

function createPrismaMock() {
  const userCreate =
    jest.fn<
      (
        args: unknown,
      ) =>
        Promise<UserCreateResult>
    >();

  const userFindFirst =
    jest.fn<
      (
        args: unknown,
      ) =>
        Promise<
          LoginUserResult | null
        >
    >();

  const sessionCreate =
    jest.fn<
      (
        args: unknown,
      ) =>
        Promise<unknown>
    >();

  const sessionUpdateMany =
    jest.fn<
      (
        args: unknown,
      ) =>
        Promise<unknown>
    >();

  const prisma = {
    user: {
      create: userCreate,
      findFirst:
        userFindFirst,
    },

    session: {
      create:
        sessionCreate,

      updateMany:
        sessionUpdateMany,
    },
  } as unknown as PrismaService;

  return {
    prisma,
    userCreate,
    userFindFirst,
    sessionCreate,
    sessionUpdateMany,
  };
}

const safeUser:
  UserCreateResult = {
    id: 'user-id',
    email:
      'user@example.com',
    username:
      'test_user',
    displayName: null,
    bio: null,
    avatarUrl: null,
    role: 'USER',
  };

describe('AuthService', () => {
  it('registers with a hashed password and hashed session token', async () => {
    const {
      prisma,
      userCreate,
    } = createPrismaMock();

    userCreate
      .mockResolvedValue(
        safeUser,
      );

    const service =
      new AuthService(prisma);

    const result =
      await service.register({
        email:
          'user@example.com',
        username:
          'test_user',
        password:
          'a-long-password-for-testing',
      });

    expect(
      result.user,
    ).toEqual(safeUser);

    expect(
      result.sessionToken,
    ).toBeTruthy();

    const call =
      userCreate.mock
        .calls[0]?.[0] as {
        data: {
          passwordHash:
            string;

          sessions: {
            create: {
              tokenHash:
                string;
              expiresAt:
                Date;
            };
          };
        };
      };

    expect(
      call.data.passwordHash,
    ).not.toBe(
      'a-long-password-for-testing',
    );

    await expect(
      verifyPassword(
        call.data.passwordHash,
        'a-long-password-for-testing',
      ),
    ).resolves.toBe(true);

    expect(
      call.data.sessions
        .create.tokenHash,
    ).toMatch(
      /^[a-f0-9]{64}$/,
    );

    expect(
      call.data.sessions
        .create.tokenHash,
    ).not.toBe(
      result.sessionToken,
    );
  });

  it('creates a new session for a valid login', async () => {
    const {
      prisma,
      userFindFirst,
      sessionCreate,
    } = createPrismaMock();

    const {
      hashPassword,
    } =
      await import(
        './security/password.security.js'
      );

    const password =
      'another-long-test-password';

    const passwordHash =
      await hashPassword(
        password,
      );

    userFindFirst
      .mockResolvedValue({
        ...safeUser,
        passwordHash,
      });

    sessionCreate
      .mockResolvedValue({});

    const service =
      new AuthService(prisma);

    const result =
      await service.login({
        identifier:
          'test_user',
        password,
      });

    expect(
      result.user,
    ).toEqual(safeUser);

    expect(
      result.sessionToken,
    ).toBeTruthy();

    expect(
      sessionCreate,
    ).toHaveBeenCalledTimes(
      1,
    );

    const call =
      sessionCreate.mock
        .calls[0]?.[0] as {
        data: {
          userId: string;
          tokenHash:
            string;
          expiresAt:
            Date;
        };
      };

    expect(
      call.data.userId,
    ).toBe('user-id');

    expect(
      call.data.tokenHash,
    ).toMatch(
      /^[a-f0-9]{64}$/,
    );

    expect(
      call.data.tokenHash,
    ).not.toBe(
      result.sessionToken,
    );
  });

  it('rejects a wrong password with generic credentials error', async () => {
    const {
      prisma,
      userFindFirst,
      sessionCreate,
    } = createPrismaMock();

    const {
      hashPassword,
    } =
      await import(
        './security/password.security.js'
      );

    const passwordHash =
      await hashPassword(
        'correct-long-password',
      );

    userFindFirst
      .mockResolvedValue({
        ...safeUser,
        passwordHash,
      });

    const service =
      new AuthService(prisma);

    await expect(
      service.login({
        identifier:
          'test_user',
        password:
          'wrong-long-password',
      }),
    ).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    );

    expect(
      sessionCreate,
    ).not.toHaveBeenCalled();
  });

  it('uses the same credentials error for an unknown account', async () => {
    const {
      prisma,
      userFindFirst,
      sessionCreate,
    } = createPrismaMock();

    userFindFirst
      .mockResolvedValue(null);

    const service =
      new AuthService(prisma);

    await expect(
      service.login({
        identifier:
          'does_not_exist',
        password:
          'some-long-password-value',
      }),
    ).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    );

    expect(
      sessionCreate,
    ).not.toHaveBeenCalled();
  });

  it('revokes an active session', async () => {
    const {
      prisma,
      sessionUpdateMany,
    } = createPrismaMock();

    sessionUpdateMany
      .mockResolvedValue({
        count: 1,
      });

    const service =
      new AuthService(prisma);

    await service.revokeSession(
      'session-id',
    );

    expect(
      sessionUpdateMany,
    ).toHaveBeenCalledWith({
      where: {
        id: 'session-id',
        revokedAt: null,
      },

      data: {
        revokedAt:
          expect.any(Date),
      },
    });
  });

  it('does nothing when logout has no session', async () => {
    const {
      prisma,
      sessionUpdateMany,
    } = createPrismaMock();

    const service =
      new AuthService(prisma);

    await service.revokeSession(
      null,
    );

    expect(
      sessionUpdateMany,
    ).not.toHaveBeenCalled();
  });
});