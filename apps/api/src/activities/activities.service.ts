import {
  Injectable,
} from '@nestjs/common';

import {
  ActivityType,
  ActivityVisibility,
  Prisma,
} from '@prisma/client';

import {
  PrismaService,
} from '../database/prisma.service.js';

import type {
  ActivityFeedInput,
} from './dto/activity-feed.input.js';

import {
  ActivityValidationError,
} from './activities.errors.js';

import type {
  ActivityItemType,
  ActivityPageType,
} from './activities.graphql.js';

const USERNAME_PATTERN =
  /^[a-z0-9_]{3,24}$/;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const activitySelect = {
  id: true,
  type: true,
  text: true,

  animeStatus: true,
  progressEpisodes: true,

  createdAt: true,

  user: {
    select: {
      username: true,
      displayName: true,
      avatarUrl: true,
      role: true,
    },
  },

  anime: {
    select: {
      id: true,
      slug: true,
      title: true,
      coverImageUrl: true,
    },
  },

  achievement: {
    select: {
      id: true,
      code: true,
      name: true,
      iconKey: true,
      titleReward: true,
    },
  },
} satisfies Prisma.ActivitySelect;

type ActivityRecord =
  Prisma.ActivityGetPayload<{
    select:
      typeof activitySelect;
  }>;

@Injectable()
class ActivitiesService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  async findPublicFeed(
    input?:
      ActivityFeedInput,
  ): Promise<
    ActivityPageType
  > {
    const {
      page,
      perPage,
    } =
      this.resolvePagination(
        input,
      );

    const where:
      Prisma.ActivityWhereInput =
      {
        user: {
          socialSettings: {
            is: {
              activityVisibility:
                ActivityVisibility
                  .PUBLIC,
            },
          },
        },
      };

    return this.findPage(
      where,
      page,
      perPage,
    );
  }

  async findFollowingFeed(
    viewerUserId: string,
    input?:
      ActivityFeedInput,
  ): Promise<
    ActivityPageType
  > {
    const {
      page,
      perPage,
    } =
      this.resolvePagination(
        input,
      );

    const following =
      await this.prisma
        .userFollow
        .findMany({
          where: {
            followerId:
              viewerUserId,
          },

          select: {
            followingId:
              true,
          },
        });

    const followedUserIds =
      following.map(
        (entry) =>
          entry.followingId,
      );

    if (
      followedUserIds.length ===
      0
    ) {
      return this.emptyPage(
        page,
        perPage,
      );
    }

    const where:
      Prisma.ActivityWhereInput =
      {
        userId: {
          in:
            followedUserIds,
        },

        user: {
          socialSettings: {
            is: {
              activityVisibility: {
                in: [
                  ActivityVisibility
                    .PUBLIC,

                  ActivityVisibility
                    .FOLLOWERS,
                ],
              },
            },
          },
        },
      };

    return this.findPage(
      where,
      page,
      perPage,
    );
  }

  async findUserFeed(
    username: string,
    viewerUserId:
      string | null,
    input?:
      ActivityFeedInput,
  ): Promise<
    ActivityPageType | null
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

    const target =
      await this.prisma
        .user
        .findUnique({
          where: {
            username:
              normalizedUsername,
          },

          select: {
            id: true,

            socialSettings: {
              select: {
                activityVisibility:
                  true,
              },
            },
          },
        });

    if (!target) {
      return null;
    }

    const {
      page,
      perPage,
    } =
      this.resolvePagination(
        input,
      );

    const visibility =
      target
        .socialSettings
        ?.activityVisibility ??
      ActivityVisibility
        .PUBLIC;

    const canView =
      await this.canViewUserFeed(
        viewerUserId,
        target.id,
        visibility,
      );

    if (!canView) {
      return this.emptyPage(
        page,
        perPage,
      );
    }

    return this.findPage(
      {
        userId:
          target.id,
      },
      page,
      perPage,
    );
  }

  async findOne(
    activityId: string,
    viewerUserId:
      string | null,
  ): Promise<
    ActivityItemType | null
  > {
    if (
      !UUID_PATTERN.test(
        activityId,
      )
    ) {
      return null;
    }

    const activity =
      await this.prisma
        .activity
        .findUnique({
          where: {
            id:
              activityId,
          },

          select: {
            ...activitySelect,

            user: {
              select: {
                id: true,
                username: true,
                displayName:
                  true,
                avatarUrl:
                  true,
                role: true,

                socialSettings: {
                  select: {
                    activityVisibility:
                      true,
                  },
                },
              },
            },
          },
        });

    if (!activity) {
      return null;
    }

    const visibility =
      activity
        .user
        .socialSettings
        ?.activityVisibility ??
      ActivityVisibility
        .PUBLIC;

    const canView =
      await this.canViewUserFeed(
        viewerUserId,
        activity.user.id,
        visibility,
      );

    if (!canView) {
      return null;
    }

    return {
      id:
        activity.id,

      type:
        activity.type,

      text:
        activity.text,

      animeStatus:
        activity.animeStatus,

      progressEpisodes:
        activity
          .progressEpisodes,

      actor: {
        username:
          activity
            .user
            .username,

        displayName:
          activity
            .user
            .displayName,

        avatarUrl:
          activity
            .user
            .avatarUrl,

        role:
          activity
            .user
            .role,
      },

      anime:
        activity.anime,

      achievement:
        activity
          .achievement,

      createdAt:
        activity.createdAt,
    };
  }

  async createText(
    userId: string,
    text: string,
  ): Promise<
    ActivityItemType
  > {
    const normalizedText =
      text.trim();

    if (
      normalizedText.length ===
        0 ||
      normalizedText.length >
        500
    ) {
      throw new ActivityValidationError(
        'Activity text must contain between 1 and 500 characters.',
      );
    }

    const [
      ,
      activity,
    ] =
      await this.prisma
        .$transaction([
          this.prisma
            .userSocialSettings
            .upsert({
              where: {
                userId,
              },

              create: {
                userId,
              },

              update: {},

              select: {
                userId: true,
              },
            }),

          this.prisma
            .activity
            .create({
              data: {
                userId,

                type:
                  ActivityType
                    .TEXT,

                text:
                  normalizedText,
              },

              select:
                activitySelect,
            }),
        ]);

    return this.mapActivity(
      activity,
    );
  }

  async deleteMine(
    userId: string,
    activityId: string,
  ): Promise<boolean> {
    if (
      !UUID_PATTERN.test(
        activityId,
      )
    ) {
      return false;
    }

    const result =
      await this.prisma
        .activity
        .deleteMany({
          where: {
            id:
              activityId,

            userId,
          },
        });

    return (
      result.count > 0
    );
  }

  private async findPage(
    where:
      Prisma.ActivityWhereInput,
    page: number,
    perPage: number,
  ): Promise<
    ActivityPageType
  > {
    const [
      total,
      items,
    ] =
      await Promise.all([
        this.prisma
          .activity
          .count({
            where,
          }),

        this.prisma
          .activity
          .findMany({
            where,

            select:
              activitySelect,

            orderBy: [
              {
                createdAt:
                  'desc',
              },
              {
                id: 'desc',
              },
            ],

            skip:
              (page - 1) *
              perPage,

            take:
              perPage,
          }),
      ]);

    const pageCount =
      total === 0
        ? 0
        : Math.ceil(
            total /
              perPage,
          );

    return {
      items:
        items.map(
          (activity) =>
            this.mapActivity(
              activity,
            ),
        ),

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

  private async canViewUserFeed(
    viewerUserId:
      string | null,
    targetUserId: string,
    visibility:
      ActivityVisibility,
  ): Promise<boolean> {
    if (
      viewerUserId ===
      targetUserId
    ) {
      return true;
    }

    if (
      visibility ===
      ActivityVisibility.PUBLIC
    ) {
      return true;
    }

    if (
      visibility ===
      ActivityVisibility.PRIVATE ||
      !viewerUserId
    ) {
      return false;
    }

    const follow =
      await this.prisma
        .userFollow
        .findUnique({
          where: {
            followerId_followingId:
              {
                followerId:
                  viewerUserId,

                followingId:
                  targetUserId,
              },
          },

          select: {
            id: true,
          },
        });

    return Boolean(
      follow,
    );
  }

  private resolvePagination(
    input?:
      ActivityFeedInput,
  ) {
    return {
      page:
        input?.page ?? 1,

      perPage:
        input?.perPage ??
        20,
    };
  }

  private emptyPage(
    page: number,
    perPage: number,
  ): ActivityPageType {
    return {
      items: [],

      pageInfo: {
        page,
        perPage,
        total: 0,
        pageCount: 0,
        hasNextPage:
          false,
        hasPreviousPage:
          false,
      },
    };
  }

  private mapActivity(
    activity:
      ActivityRecord,
  ): ActivityItemType {
    return {
      id:
        activity.id,

      type:
        activity.type,

      text:
        activity.text,

      animeStatus:
        activity.animeStatus,

      progressEpisodes:
        activity
          .progressEpisodes,

      actor:
        activity.user,

      anime:
        activity.anime,

      achievement:
        activity
          .achievement,

      createdAt:
        activity.createdAt,
    };
  }
}

export {
  ActivitiesService,
};
