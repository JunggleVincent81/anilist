import {
  Injectable,
} from '@nestjs/common';

import type {
  Prisma,
} from '@prisma/client';

import {
  PrismaService,
} from '../database/prisma.service.js';

import type {
  UserFollowListInput,
} from './dto/user-follow-list.input.js';

import {
  UserFollowValidationError,
} from './user-follows.errors.js';

import type {
  UserFollowPageType,
  UserFollowStatusType,
  UserFollowSummaryType,
} from './user-follows.graphql.js';

const USERNAME_PATTERN =
  /^[a-z0-9_]{3,24}$/;

const followUserSelect = {
  username: true,
  displayName: true,
  avatarUrl: true,
  role: true,
} satisfies Prisma.UserSelect;

type FollowTarget = {
  id: string;
  username: string;
};

@Injectable()
class UserFollowsService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  async findSummary(
    username: string,
  ): Promise<
    UserFollowSummaryType | null
  > {
    const target =
      await this.findTarget(
        username,
      );

    if (!target) {
      return null;
    }

    const [
      followersCount,
      followingCount,
    ] =
      await Promise.all([
        this.prisma
          .userFollow
          .count({
            where: {
              followingId:
                target.id,
            },
          }),

        this.prisma
          .userFollow
          .count({
            where: {
              followerId:
                target.id,
            },
          }),
      ]);

    return {
      username:
        target.username,

      followersCount,
      followingCount,
    };
  }

  async findStatus(
    viewerUserId: string,
    username: string,
  ): Promise<
    UserFollowStatusType | null
  > {
    const target =
      await this.findTarget(
        username,
      );

    if (!target) {
      return null;
    }

    return this.buildStatus(
      viewerUserId,
      target,
    );
  }

  async follow(
    followerId: string,
    username: string,
  ): Promise<
    UserFollowStatusType
  > {
    const target =
      await this.requireTarget(
        username,
      );

    if (
      followerId === target.id
    ) {
      throw new UserFollowValidationError(
        'You cannot follow yourself.',
      );
    }

    await this.prisma
      .userFollow
      .upsert({
        where: {
          followerId_followingId: {
            followerId,
            followingId:
              target.id,
          },
        },

        create: {
          followerId,
          followingId:
            target.id,
        },

        update: {},
      });

    return this.buildStatus(
      followerId,
      target,
    );
  }

  async unfollow(
    followerId: string,
    username: string,
  ): Promise<
    UserFollowStatusType
  > {
    const target =
      await this.requireTarget(
        username,
      );

    if (
      followerId === target.id
    ) {
      throw new UserFollowValidationError(
        'You cannot unfollow yourself.',
      );
    }

    await this.prisma
      .userFollow
      .deleteMany({
        where: {
          followerId,
          followingId:
            target.id,
        },
      });

    return this.buildStatus(
      followerId,
      target,
    );
  }

  async findFollowers(
    input: UserFollowListInput,
  ): Promise<
    UserFollowPageType | null
  > {
    const target =
      await this.findTarget(
        input.username,
      );

    if (!target) {
      return null;
    }

    const page =
      input.page ?? 1;

    const perPage =
      input.perPage ?? 20;

    const where:
      Prisma.UserFollowWhereInput =
      {
        followingId:
          target.id,
      };

    const [
      total,
      entries,
    ] =
      await Promise.all([
        this.prisma
          .userFollow
          .count({
            where,
          }),

        this.prisma
          .userFollow
          .findMany({
            where,

            select: {
              id: true,

              follower: {
                select:
                  followUserSelect,
              },
            },

            orderBy: [
              {
                createdAt:
                  'desc',
              },
              {
                id: 'asc',
              },
            ],

            skip:
              (page - 1) *
              perPage,

            take:
              perPage,
          }),
      ]);

    return this.buildPage(
      target.username,
      entries.map(
        (entry) =>
          entry.follower,
      ),
      page,
      perPage,
      total,
    );
  }

  async findFollowing(
    input: UserFollowListInput,
  ): Promise<
    UserFollowPageType | null
  > {
    const target =
      await this.findTarget(
        input.username,
      );

    if (!target) {
      return null;
    }

    const page =
      input.page ?? 1;

    const perPage =
      input.perPage ?? 20;

    const where:
      Prisma.UserFollowWhereInput =
      {
        followerId:
          target.id,
      };

    const [
      total,
      entries,
    ] =
      await Promise.all([
        this.prisma
          .userFollow
          .count({
            where,
          }),

        this.prisma
          .userFollow
          .findMany({
            where,

            select: {
              id: true,

              following: {
                select:
                  followUserSelect,
              },
            },

            orderBy: [
              {
                createdAt:
                  'desc',
              },
              {
                id: 'asc',
              },
            ],

            skip:
              (page - 1) *
              perPage,

            take:
              perPage,
          }),
      ]);

    return this.buildPage(
      target.username,
      entries.map(
        (entry) =>
          entry.following,
      ),
      page,
      perPage,
      total,
    );
  }

  private async buildStatus(
    viewerUserId: string,
    target: FollowTarget,
  ): Promise<
    UserFollowStatusType
  > {
    const isSelf =
      viewerUserId ===
      target.id;

    const [
      followersCount,
      followingCount,
      relationship,
    ] =
      await Promise.all([
        this.prisma
          .userFollow
          .count({
            where: {
              followingId:
                target.id,
            },
          }),

        this.prisma
          .userFollow
          .count({
            where: {
              followerId:
                target.id,
            },
          }),

        isSelf
          ? Promise.resolve(
              null,
            )
          : this.prisma
              .userFollow
              .findUnique({
                where: {
                  followerId_followingId:
                    {
                      followerId:
                        viewerUserId,

                      followingId:
                        target.id,
                    },
                },

                select: {
                  id: true,
                },
              }),
      ]);

    return {
      username:
        target.username,

      isFollowing:
        Boolean(
          relationship,
        ),

      isSelf,

      followersCount,
      followingCount,
    };
  }

  private buildPage(
    username: string,
    users:
      {
        username: string;
        displayName:
          string | null;
        avatarUrl:
          string | null;
        role: string;
      }[],
    page: number,
    perPage: number,
    total: number,
  ): UserFollowPageType {
    const pageCount =
      total === 0
        ? 0
        : Math.ceil(
            total /
              perPage,
          );

    return {
      username,
      users,

      pageInfo: {
        page,
        perPage,
        total,
        pageCount,

        hasNextPage:
          page <
          pageCount,

        hasPreviousPage:
          total > 0 &&
          page > 1,
      },
    };
  }

  private async requireTarget(
    username: string,
  ): Promise<FollowTarget> {
    const target =
      await this.findTarget(
        username,
      );

    if (!target) {
      throw new UserFollowValidationError(
        'User not found.',
      );
    }

    return target;
  }

  private async findTarget(
    username: string,
  ): Promise<
    FollowTarget | null
  > {
    const normalizedUsername =
      username
        .trim()
        .toLowerCase();

    if (
      !USERNAME_PATTERN.test(
        normalizedUsername,
      )
    ) {
      return null;
    }

    return this.prisma
      .user
      .findUnique({
        where: {
          username:
            normalizedUsername,
        },

        select: {
          id: true,
          username: true,
        },
      });
  }
}

export {
  UserFollowsService,
};
