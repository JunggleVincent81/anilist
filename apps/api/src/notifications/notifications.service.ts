import { Injectable, Logger } from '@nestjs/common';
import { NotificationKind, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';
import type { NotificationFeedInput, SocialNotificationPageType } from './notifications.graphql.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const notificationSelect = {
  id: true,
  kind: true,
  sourceId: true,
  targetActivityId: true,
  isRead: true,
  createdAt: true,
  actor: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
} satisfies Prisma.NotificationSelect;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  constructor(private readonly prisma: PrismaService) {}

  private async deliver(input: {
    recipientId: string;
    actorId: string;
    kind: NotificationKind;
    sourceId: string;
    targetActivityId?: string;
  }): Promise<void> {
    if (input.recipientId === input.actorId) return;
    try {
      await this.prisma.notification.upsert({
        where: { recipientId_kind_sourceId: {
          recipientId: input.recipientId,
          kind: input.kind,
          sourceId: input.sourceId,
        } },
        create: {
          recipientId: input.recipientId,
          actorId: input.actorId,
          kind: input.kind,
          sourceId: input.sourceId,
          targetActivityId: input.targetActivityId ?? null,
        },
        update: {},
        select: { id: true },
      });
    } catch (error) {
      this.logger.warn(`Notification delivery skipped: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async notifyFollowBestEffort(input: { actorId: string; recipientId: string; sourceId: string }): Promise<void> {
    await this.deliver({ ...input, kind: NotificationKind.FOLLOW });
  }

  async notifyActivityLikeBestEffort(input: { actorId: string; activityId: string; sourceId: string }): Promise<void> {
    await this.notifyActivity(input, NotificationKind.ACTIVITY_LIKE);
  }

  async notifyActivityReplyBestEffort(input: { actorId: string; activityId: string; sourceId: string }): Promise<void> {
    await this.notifyActivity(input, NotificationKind.ACTIVITY_REPLY);
  }

  private async notifyActivity(input: { actorId: string; activityId: string; sourceId: string }, kind: NotificationKind): Promise<void> {
    try {
      const activity = await this.prisma.activity.findUnique({
        where: { id: input.activityId }, select: { userId: true },
      });
      if (!activity) return;
      await this.deliver({
        actorId: input.actorId, recipientId: activity.userId, sourceId: input.sourceId,
        kind, targetActivityId: input.activityId,
      });
    } catch (error) {
      this.logger.warn(`Notification lookup skipped: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async feed(recipientId: string, input?: NotificationFeedInput): Promise<SocialNotificationPageType> {
    const page = input?.page ?? 1;
    const perPage = input?.perPage ?? 20;
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(perPage) || perPage < 1 || perPage > 100 || (page - 1) * perPage > 2147483647) {
      throw new Error('Invalid notification pagination.');
    }
    if (input?.unreadOnly !== undefined && typeof input.unreadOnly !== 'boolean') {
      throw new Error('Invalid unreadOnly filter.');
    }
    const where: Prisma.NotificationWhereInput = {
      recipientId,
      ...(input?.unreadOnly ? { isRead: false } : {}),
    };
    const [total, items] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where, select: notificationSelect,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);
    const pageCount = Math.ceil(total / perPage);
    return {
      items,
      pageInfo: {
        page, perPage, total, pageCount,
        hasNextPage: page < pageCount,
        hasPreviousPage: total > 0 && page > 1,
      },
    };
  }

  unreadCount(recipientId: string): Promise<number> {
    return this.prisma.notification.count({ where: { recipientId, isRead: false } });
  }

  async markRead(recipientId: string, id: string): Promise<boolean> {
    if (!UUID.test(id)) return false;
    const result = await this.prisma.notification.updateMany({
      where: { id, recipientId, isRead: false }, data: { isRead: true },
    });
    if (result.count > 0) return true;
    return this.prisma.notification.count({ where: { id, recipientId } }).then(count => count > 0);
  }

  async markAllRead(recipientId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { recipientId, isRead: false }, data: { isRead: true },
    });
    return result.count;
  }

  async deleteMine(recipientId: string, id: string): Promise<boolean> {
    if (!UUID.test(id)) return false;
    const result = await this.prisma.notification.deleteMany({ where: { id, recipientId } });
    return result.count > 0;
  }
}
