import { describe, expect, it, jest } from '@jest/globals';
import { NotificationKind } from '@prisma/client';
import type { PrismaService } from '../database/prisma.service.js';
import { NotificationsService } from './notifications.service.js';

const OWNER = '11111111-1111-4111-8111-111111111111';
const ACTOR = '22222222-2222-4222-8222-222222222222';
const EVENT = '33333333-3333-4333-8333-333333333333';
const ACTIVITY = '44444444-4444-4444-8444-444444444444';
const NOTIFICATION = '55555555-5555-4555-8555-555555555555';

function setup() {
  const upsert = jest.fn(async (_args: unknown) => ({ id: NOTIFICATION }));
  const findActivity = jest.fn(async (_args: unknown): Promise<{ userId: string } | null> => ({ userId: OWNER }));
  const count = jest.fn(async (_args: unknown) => 2);
  const findMany = jest.fn(async (_args: unknown) => [{
    id: NOTIFICATION, kind: NotificationKind.FOLLOW, sourceId: EVENT,
    targetActivityId: null, isRead: false, createdAt: new Date('2026-10-09T00:00:00Z'),
    actor: { id: ACTOR, username: 'actor', displayName: null, avatarUrl: null },
  }]);
  const updateMany = jest.fn(async (_args: unknown) => ({ count: 1 }));
  const deleteMany = jest.fn(async (_args: unknown) => ({ count: 1 }));
  const prisma = {
    notification: { upsert, count, findMany, updateMany, deleteMany },
    activity: { findUnique: findActivity },
  } as unknown as PrismaService;
  return { service: new NotificationsService(prisma), upsert, count, findMany, updateMany, deleteMany, findActivity };
}

describe('NotificationsService AN-123', () => {
  it('emits deduplicated follow with source id, not on self follow', async () => {
    const { service, upsert } = setup();
    await service.notifyFollowBestEffort({ actorId: ACTOR, recipientId: OWNER, sourceId: EVENT });
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { recipientId_kind_sourceId: { recipientId: OWNER, kind: NotificationKind.FOLLOW, sourceId: EVENT } },
      update: {},
    }));
    await service.notifyFollowBestEffort({ actorId: OWNER, recipientId: OWNER, sourceId: EVENT });
    expect(upsert).toHaveBeenCalledTimes(1);
  });

  it('routes likes and replies to activity owner without copying content', async () => {
    const { service, upsert } = setup();
    await service.notifyActivityLikeBestEffort({ actorId: ACTOR, activityId: ACTIVITY, sourceId: EVENT });
    await service.notifyActivityReplyBestEffort({ actorId: ACTOR, activityId: ACTIVITY, sourceId: EVENT });
    expect(upsert).toHaveBeenCalledTimes(2);
    expect(upsert).toHaveBeenNthCalledWith(1, expect.objectContaining({ create: expect.objectContaining({ kind: NotificationKind.ACTIVITY_LIKE, recipientId: OWNER, targetActivityId: ACTIVITY }) }));
    expect(upsert).toHaveBeenNthCalledWith(2, expect.objectContaining({ create: expect.objectContaining({ kind: NotificationKind.ACTIVITY_REPLY, recipientId: OWNER, targetActivityId: ACTIVITY }) }));
    const serialized = JSON.stringify(upsert.mock.calls);
    expect(serialized).not.toContain('body');
  });

  it('skips activity notification when activity is missing', async () => {
    const { service, findActivity, upsert } = setup();
    findActivity.mockResolvedValueOnce(null);
    await service.notifyActivityLikeBestEffort({ actorId: ACTOR, activityId: ACTIVITY, sourceId: EVENT });
    expect(upsert).not.toHaveBeenCalled();
  });

  it('keeps parent operation successful when delivery fails', async () => {
    const { service, upsert } = setup();
    upsert.mockRejectedValueOnce(new Error('temporary failure'));
    await expect(service.notifyFollowBestEffort({ actorId: ACTOR, recipientId: OWNER, sourceId: EVENT })).resolves.toBeUndefined();
  });

  it('returns recipient-scoped paginated notifications', async () => {
    const { service, findMany } = setup();
    const result = await service.feed(OWNER, { page: 2, perPage: 1, unreadOnly: true });
    expect(result.pageInfo).toEqual({ page: 2, perPage: 1, total: 2, pageCount: 2, hasNextPage: false, hasPreviousPage: true });
    expect(result.items[0].actor.username).toBe('actor');
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { recipientId: OWNER, isRead: false }, skip: 1, take: 1,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    }));
  });

  it('rejects invalid pagination', async () => {
    const { service } = setup();
    await expect(service.feed(OWNER, { perPage: 101 })).rejects.toThrow('Invalid notification pagination');
    await expect(service.feed(OWNER, { page: 0 })).rejects.toThrow('Invalid notification pagination');
  });

  it('scopes unread count and mark/delete operations to recipient', async () => {
    const { service, count, updateMany, deleteMany } = setup();
    expect(await service.unreadCount(OWNER)).toBe(2);
    expect(count).toHaveBeenCalledWith({ where: { recipientId: OWNER, isRead: false } });
    expect(await service.markRead(OWNER, NOTIFICATION)).toBe(true);
    expect(updateMany).toHaveBeenCalledWith({ where: { id: NOTIFICATION, recipientId: OWNER, isRead: false }, data: { isRead: true } });
    expect(await service.markAllRead(OWNER)).toBe(1);
    expect(updateMany).toHaveBeenCalledWith({ where: { recipientId: OWNER, isRead: false }, data: { isRead: true } });
    expect(await service.deleteMine(OWNER, NOTIFICATION)).toBe(true);
    expect(deleteMany).toHaveBeenCalledWith({ where: { id: NOTIFICATION, recipientId: OWNER } });
  });

  it('rejects invalid notification id without touching database', async () => {
    const { service, updateMany, deleteMany } = setup();
    expect(await service.markRead(OWNER, 'invalid')).toBe(false);
    expect(await service.deleteMine(OWNER, 'invalid')).toBe(false);
    expect(updateMany).not.toHaveBeenCalled();
    expect(deleteMany).not.toHaveBeenCalled();
  });
});
