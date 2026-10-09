import {
  Injectable,
} from '@nestjs/common';

import {
  ActivityVisibility,
  Prisma,
} from '@prisma/client';

import {
  PrismaService,
} from '../database/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';

import {
  ActivityInteractionValidationError,
  ActivityUnavailableError,
} from './activity-interactions.errors.js';

import type {
  ActivityFeedInput,
} from './dto/activity-feed.input.js';

import type {
  ActivityReplyPageType,
  ActivityReplyType,
} from './activities.graphql.js';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const replySelect = {
  id: true,
  activityId: true,
  body: true,
  createdAt: true,

  user: {
    select: {
      username: true,
      displayName: true,
      avatarUrl: true,
      role: true,
    },
  },
} satisfies Prisma.ActivityReplySelect;

type ReplyRecord =
  Prisma.ActivityReplyGetPayload<{
    select:
      typeof replySelect;
  }>;

@Injectable()
class ActivityInteractionsService {
  constructor(
    private readonly prisma:
      PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async like(
    userId: string,
    activityId: string,
  ): Promise<boolean> {
    await this.requireVisibleActivity(
      activityId,
      userId,
    );

    const likeRecord = await this.prisma
      .activityLike
      .upsert({
        where: {
          activityId_userId: {
            activityId,
            userId,
          },
        },

        create: {
          activityId,
          userId,
        },

        update: {},

        select: {
          id: true,
        },
      });

    await this.notifications.notifyActivityLikeBestEffort({
      actorId: userId,
      activityId,
      sourceId: likeRecord.id,
    });

    return true;
  }

  async unlike(
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
        .activityLike
        .deleteMany({
          where: {
            activityId,
            userId,
          },
        });

    return (
      result.count > 0
    );
  }

  async findReplies(
    activityId: string,
    viewerUserId:
      string | null,
    input?:
      ActivityFeedInput,
  ): Promise<
    ActivityReplyPageType | null
  > {
    const activity =
      await this.findVisibleActivity(
        activityId,
        viewerUserId,
      );

    if (!activity) {
      return null;
    }

    const page =
      input?.page ?? 1;

    const perPage =
      input?.perPage ?? 20;

    const where:
      Prisma.ActivityReplyWhereInput =
      {
        activityId,
      };

    const [
      total,
      replies,
    ] =
      await Promise.all([
        this.prisma
          .activityReply
          .count({
            where,
          }),

        this.prisma
          .activityReply
          .findMany({
            where,

            select:
              replySelect,

            orderBy: [
              {
                createdAt:
                  'asc',
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

    const pageCount =
      total === 0
        ? 0
        : Math.ceil(
            total /
              perPage,
          );

    return {
      items:
        replies.map(
          (reply) =>
            this.mapReply(
              reply,
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

  async createReply(
    userId: string,
    activityId: string,
    body: string,
  ): Promise<
    ActivityReplyType
  > {
    await this.requireVisibleActivity(
      activityId,
      userId,
    );

    const normalizedBody =
      body.trim();

    if (
      normalizedBody.length ===
        0 ||
      normalizedBody.length >
        500
    ) {
      throw new ActivityInteractionValidationError(
        'Reply must contain between 1 and 500 characters.',
      );
    }

    const reply =
      await this.prisma
        .activityReply
        .create({
          data: {
            activityId,
            userId,

            body:
              normalizedBody,
          },

          select:
            replySelect,
        });

    await this.notifications.notifyActivityReplyBestEffort({
      actorId: userId,
      activityId,
      sourceId: reply.id,
    });

    return this.mapReply(
      reply,
    );
  }

  async deleteMine(
    userId: string,
    replyId: string,
  ): Promise<boolean> {
    if (
      !UUID_PATTERN.test(
        replyId,
      )
    ) {
      return false;
    }

    const result =
      await this.prisma
        .activityReply
        .deleteMany({
          where: {
            id:
              replyId,

            userId,
          },
        });

    return (
      result.count > 0
    );
  }

  private async requireVisibleActivity(
    activityId: string,
    viewerUserId:
      string | null,
  ): Promise<void> {
    const activity =
      await this.findVisibleActivity(
        activityId,
        viewerUserId,
      );

    if (!activity) {
      throw new ActivityUnavailableError();
    }
  }

  private async findVisibleActivity(
    activityId: string,
    viewerUserId:
      string | null,
  ): Promise<{
    id: string;
    userId: string;
  } | null> {
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
            id: true,
            userId: true,

            user: {
              select: {
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

    if (
      activity.userId ===
      viewerUserId
    ) {
      return {
        id:
          activity.id,

        userId:
          activity.userId,
      };
    }

    const visibility =
      activity
        .user
        .socialSettings
        ?.activityVisibility ??
      ActivityVisibility
        .PUBLIC;

    if (
      visibility ===
      ActivityVisibility.PUBLIC
    ) {
      return {
        id:
          activity.id,

        userId:
          activity.userId,
      };
    }

    if (
      visibility ===
        ActivityVisibility.PRIVATE ||
      !viewerUserId
    ) {
      return null;
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
                  activity.userId,
              },
          },

          select: {
            id: true,
          },
        });

    return follow
      ? {
          id:
            activity.id,

          userId:
            activity.userId,
        }
      : null;
  }

  private mapReply(
    reply:
      ReplyRecord,
  ): ActivityReplyType {
    return {
      id:
        reply.id,

      activityId:
        reply.activityId,

      body:
        reply.body,

      author:
        reply.user,

      createdAt:
        reply.createdAt,
    };
  }
}

export {
  ActivityInteractionsService,
};
