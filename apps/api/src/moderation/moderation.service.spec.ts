import { describe, expect, it, jest } from '@jest/globals';
import { ActivityVisibility, ReportReason, ReportStatus, ReportTargetType } from '@prisma/client';
import type { PrismaService } from '../database/prisma.service.js';
import { ModerationService, ReportConflictError, ReportTargetUnavailableError, ReportValidationError } from './moderation.service.js';

const REPORTER = '11111111-1111-4111-8111-111111111111';
const OWNER = '22222222-2222-4222-8222-222222222222';
const TARGET = '33333333-3333-4333-8333-333333333333';
const REPORT = '44444444-4444-4444-8444-444444444444';

function setup() {
  const userFind = jest.fn(async () => ({ id: OWNER }));
  const activityFind = jest.fn(async () => ({ userId: OWNER, user: { socialSettings: null as { activityVisibility: ActivityVisibility } | null } }));
  const reviewFind = jest.fn(async () => ({ userId: OWNER }));
  const followFind = jest.fn(async () => ({ id: TARGET }));
  const count = jest.fn(async (_args: unknown) => 0);
  const create = jest.fn(async (_args: unknown) => ({ id: REPORT, status: ReportStatus.OPEN }));
  const findMany = jest.fn(async (_args: unknown) => []);
  const updateMany = jest.fn(async (_args: unknown) => ({ count: 1 }));
  const findUnique = jest.fn(async () => ({ id: REPORT, status: ReportStatus.RESOLVED }));
  const prisma = {
    user: { findUnique: userFind },
    activity: { findUnique: activityFind },
    animeReview: { findUnique: reviewFind },
    userFollow: { findUnique: followFind },
    contentReport: { count, create, findMany, updateMany, findUnique },
  } as unknown as PrismaService;
  return { service: new ModerationService(prisma), create, count, updateMany, findMany, activityFind, reviewFind, userFind, followFind };
}
const reportInput = { targetType: ReportTargetType.ACTIVITY, targetId: TARGET, reason: ReportReason.SPAM, details: '  spam message  ' };

describe('AN-124 ModerationService', () => {
  it('submits trimmed report without exposing private moderation data', async () => {
    const { service, create } = setup();
    await service.submit(REPORTER, reportInput);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: { reporterId: REPORTER, targetType: ReportTargetType.ACTIVITY, targetId: TARGET, reason: ReportReason.SPAM, details: 'spam message' } }));
  });
  it('rejects reporting own profile', async () => {
    const { service, userFind, create } = setup();
    userFind.mockResolvedValueOnce({ id: REPORTER });
    await expect(service.submit(REPORTER, { ...reportInput, targetType: ReportTargetType.USER })).rejects.toBeInstanceOf(ReportValidationError);
    expect(create).not.toHaveBeenCalled();
  });
  it('rejects hidden activity reported by a stranger', async () => {
    const { service, activityFind, create } = setup();
    activityFind.mockResolvedValueOnce({ userId: OWNER, user: { socialSettings: { activityVisibility: ActivityVisibility.PRIVATE } } });
    await expect(service.submit(REPORTER, reportInput)).rejects.toBeInstanceOf(ReportTargetUnavailableError);
    expect(create).not.toHaveBeenCalled();
  });
  it('requires following for FOLLOWERS-only activity', async () => {
    const { service, activityFind, followFind, create } = setup();
    activityFind.mockResolvedValueOnce({ userId: OWNER, user: { socialSettings: { activityVisibility: ActivityVisibility.FOLLOWERS } } });
    followFind.mockResolvedValueOnce(null as never);
    await expect(service.submit(REPORTER, reportInput)).rejects.toBeInstanceOf(ReportTargetUnavailableError);
    expect(create).not.toHaveBeenCalled();
  });
  it('accepts review reports', async () => {
    const { service, reviewFind, create } = setup();
    await service.submit(REPORTER, { ...reportInput, targetType: ReportTargetType.REVIEW });
    expect(reviewFind).toHaveBeenCalled();
    expect(create).toHaveBeenCalled();
  });
  it('enforces 20/day report limit', async () => {
    const { service, count, create } = setup();
    count.mockResolvedValueOnce(20);
    await expect(service.submit(REPORTER, reportInput)).rejects.toBeInstanceOf(ReportValidationError);
    expect(create).not.toHaveBeenCalled();
  });
  it('rejects invalid target id', async () => {
    const { service, create } = setup();
    await expect(service.submit(REPORTER, { ...reportInput, targetId: 'bad' })).rejects.toBeInstanceOf(ReportValidationError);
    expect(create).not.toHaveBeenCalled();
  });
  it('lists only own reports', async () => {
    const { service, count, findMany } = setup();
    const result = await service.mine(REPORTER, { page: 1, perPage: 10 });
    expect(count).toHaveBeenCalledWith({ where: { reporterId: REPORTER } });
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { reporterId: REPORTER }, take: 10 }));
    expect(result.pageInfo.total).toBe(0);
  });
  it('defaults moderation queue to OPEN status', async () => {
    const { service, findMany } = setup();
    await service.queue();
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: ReportStatus.OPEN } }));
  });
  it('resolves OPEN report atomically and records reviewer', async () => {
    const { service, updateMany } = setup();
    await service.resolve(OWNER, { id: REPORT, status: ReportStatus.RESOLVED, note: 'Checked and reviewed.' });
    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: REPORT, status: ReportStatus.OPEN }, data: expect.objectContaining({ reviewerId: OWNER, status: ReportStatus.RESOLVED }) }));
  });
  it('rejects double resolution', async () => {
    const { service, updateMany } = setup();
    updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(service.resolve(OWNER, { id: REPORT, status: ReportStatus.RESOLVED, note: 'Checked and reviewed.' })).rejects.toBeInstanceOf(ReportConflictError);
  });
  it('rejects reopening / missing note', async () => {
    const { service, updateMany } = setup();
    await expect(service.resolve(OWNER, { id: REPORT, status: ReportStatus.OPEN, note: 'Checked and reviewed.' })).rejects.toBeInstanceOf(ReportValidationError);
    await expect(service.resolve(OWNER, { id: REPORT, status: ReportStatus.DISMISSED, note: 'bad' })).rejects.toBeInstanceOf(ReportValidationError);
    expect(updateMany).not.toHaveBeenCalled();
  });
});
