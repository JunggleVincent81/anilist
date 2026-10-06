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
  UsersService,
} from './users.service.js';

type PublicProfile = {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  role: 'USER';
  createdAt: Date;
};

type UpdatedUser = {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  role: 'USER';
};

function createPrismaMock() {
  const findUnique =
    jest.fn<
      (
        args: unknown,
      ) =>
        Promise<
          PublicProfile | null
        >
    >();

  const update =
    jest.fn<
      (
        args: unknown,
      ) =>
        Promise<UpdatedUser>
    >();

  const prisma = {
    user: {
      findUnique,
      update,
    },
  } as unknown as PrismaService;

  return {
    prisma,
    findUnique,
    update,
  };
}

describe('UsersService', () => {
  it('normalizes usernames for public profile lookup', async () => {
    const {
      prisma,
      findUnique,
    } = createPrismaMock();

    findUnique
      .mockResolvedValue(null);

    const service =
      new UsersService(prisma);

    await service
      .findPublicProfile(
        '  TEGAR_01  ',
      );

    expect(
      findUnique,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          username:
            'tegar_01',
        },
      }),
    );
  });

  it('rejects malformed usernames without querying the database', async () => {
    const {
      prisma,
      findUnique,
    } = createPrismaMock();

    const service =
      new UsersService(prisma);

    await expect(
      service.findPublicProfile(
        'invalid username!',
      ),
    ).resolves.toBeNull();

    expect(
      findUnique,
    ).not.toHaveBeenCalled();
  });

  it('does not select private account fields for public profiles', async () => {
    const {
      prisma,
      findUnique,
    } = createPrismaMock();

    findUnique
      .mockResolvedValue(null);

    const service =
      new UsersService(prisma);

    await service
      .findPublicProfile(
        'tegar_01',
      );

    const call =
      findUnique.mock
        .calls[0]?.[0] as {
        select:
          Record<
            string,
            boolean
          >;
      };

    expect(
      call.select.email,
    ).toBeUndefined();

    expect(
      call.select
        .passwordHash,
    ).toBeUndefined();

    expect(
      call.select.sessions,
    ).toBeUndefined();

    expect(
      call.select,
    ).toEqual({
      id: true,
      username: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      role: true,
      createdAt: true,
    });
  });

  it('updates only the authenticated user id', async () => {
    const {
      prisma,
      update,
    } = createPrismaMock();

    update.mockResolvedValue({
      id: 'user-id',
      email:
        'user@example.com',
      username:
        'test_user',
      displayName:
        'Vincent',
      bio: 'Anime enjoyer.',
      avatarUrl: null,
      role: 'USER',
    });

    const service =
      new UsersService(prisma);

    await service.updateProfile(
      'user-id',
      {
        displayName:
          'Vincent',

        bio:
          'Anime enjoyer.',
      },
    );

    expect(
      update,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'user-id',
        },

        data: {
          displayName:
            'Vincent',

          bio:
            'Anime enjoyer.',
        },
      }),
    );
  });

  it('does not overwrite fields omitted from profile input', async () => {
    const {
      prisma,
      update,
    } = createPrismaMock();

    update.mockResolvedValue({
      id: 'user-id',
      email:
        'user@example.com',
      username:
        'test_user',
      displayName:
        'Vincent',
      bio: null,
      avatarUrl: null,
      role: 'USER',
    });

    const service =
      new UsersService(prisma);

    await service.updateProfile(
      'user-id',
      {
        bio: null,
      },
    );

    const call =
      update.mock
        .calls[0]?.[0] as {
        data:
          Record<
            string,
            unknown
          >;
      };

    expect(
      call.data,
    ).toEqual({
      bio: null,
    });

    expect(
      call.data
        .displayName,
    ).toBeUndefined();

    expect(
      call.data.avatarUrl,
    ).toBeUndefined();
  });
});