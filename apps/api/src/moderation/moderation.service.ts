import { Injectable } from '@nestjs/common';
import { ActivityVisibility, Prisma, ReportReason, ReportStatus, ReportTargetType } from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';
import type { ModerationQueueInput, ReportPageInput, ResolveContentReportInput, SubmitContentReportInput } from './moderation.graphql.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ReportValidationError extends Error {}
export class ReportConflictError extends Error {}
export class ReportTargetUnavailableError extends Error {}

const reportSelect = {
  id: true, targetType: true, targetId: true, reason: true,
  details: true, status: true, createdAt: true, updatedAt: true, reviewedAt: true,
} satisfies Prisma.ContentReportSelect;

const moderationSelect = {
  ...reportSelect, moderatorNote: true,
  reporter: { select: { id: true, username: true } },
  reviewer: { select: { id: true, username: true } },
} satisfies Prisma.ContentReportSelect;

@Injectable()
export class ModerationService {
  constructor(private readonly prisma: PrismaService) {}

  private pagination(input?: ReportPageInput) {
    const page = input?.page ?? 1;
    const perPage = input?.perPage ?? 20;
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(perPage) || perPage < 1 || perPage > 100 || (page - 1) * perPage > 100_000) {
      throw new ReportValidationError('Invalid report pagination.');
    }
    return { page, perPage };
  }

  private async verifyTarget(reporterId: string, type: ReportTargetType, targetId: string): Promise<void> {
    let ownerId: string | undefined;
    if (type === ReportTargetType.USER) {
      const user = await this.prisma.user.findUnique({ where: { id: targetId }, select: { id: true } });
      ownerId = user?.id;
    } else if (type === ReportTargetType.REVIEW) {
      const review = await this.prisma.animeReview.findUnique({ where: { id: targetId }, select: { userId: true } });
      ownerId = review?.userId;
    } else if (type === ReportTargetType.ACTIVITY) {
      const activity = await this.prisma.activity.findUnique({
        where: { id: targetId },
        select: { userId: true, user: { select: { socialSettings: { select: { activityVisibility: true } } } } },
      });
      ownerId = activity?.userId;
      if (activity && ownerId !== reporterId) {
        const visibility = activity.user.socialSettings?.activityVisibility ?? ActivityVisibility.PUBLIC;
        if (visibility === ActivityVisibility.PRIVATE) throw new ReportTargetUnavailableError('Target is unavailable.');
        if (visibility === ActivityVisibility.FOLLOWERS) {
          const follow = await this.prisma.userFollow.findUnique({
            where: { followerId_followingId: { followerId: reporterId, followingId: activity.userId } },
            select: { id: true },
          });
          if (!follow) throw new ReportTargetUnavailableError('Target is unavailable.');
        }
      }
    }
    if (!ownerId) throw new ReportTargetUnavailableError('Target is unavailable.');
    if (ownerId === reporterId) throw new ReportValidationError('You cannot report your own content or profile.');
  }

  async submit(reporterId: string, input: SubmitContentReportInput) {
    if (!UUID.test(input.targetId) || !Object.values(ReportTargetType).includes(input.targetType) || !Object.values(ReportReason).includes(input.reason)) {
      throw new ReportValidationError('Invalid report target or reason.');
    }
    if (input.details !== undefined && (typeof input.details !== 'string' || input.details.trim().length > 500)) {
      throw new ReportValidationError('Invalid report details.');
    }
    const details = input.details?.trim() || null;
    await this.verifyTarget(reporterId, input.targetType, input.targetId);
    const recent = await this.prisma.contentReport.count({
      where: { reporterId, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    });
    if (recent >= 20) throw new ReportValidationError('Daily report limit reached.');
    try {
      return await this.prisma.contentReport.create({
        data: { reporterId, targetType: input.targetType, targetId: input.targetId, reason: input.reason, details },
        select: reportSelect,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ReportConflictError('This target was already reported by your account.');
      }
      throw error;
    }
  }

  async mine(reporterId: string, input?: ReportPageInput) {
    const { page, perPage } = this.pagination(input);
    const where = { reporterId };
    const [total, items] = await Promise.all([
      this.prisma.contentReport.count({ where }),
      this.prisma.contentReport.findMany({
        where, select: reportSelect, skip: (page - 1) * perPage, take: perPage,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
    ]);
    return { items, pageInfo: this.pageInfo(page, perPage, total) };
  }

  async queue(input?: ModerationQueueInput) {
    const { page, perPage } = this.pagination(input);
    if (input?.status !== undefined && !Object.values(ReportStatus).includes(input.status)) {
      throw new ReportValidationError('Invalid report status.');
    }
    const where: Prisma.ContentReportWhereInput = input?.status ? { status: input.status } : { status: ReportStatus.OPEN };
    const [total, items] = await Promise.all([
      this.prisma.contentReport.count({ where }),
      this.prisma.contentReport.findMany({
        where, select: moderationSelect, skip: (page - 1) * perPage, take: perPage,
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      }),
    ]);
    return { items, pageInfo: this.pageInfo(page, perPage, total) };
  }

  async resolve(reviewerId: string, input: ResolveContentReportInput) {
    const note = typeof input.note === 'string' ? input.note.trim() : '';
    if (!UUID.test(input.id) || (input.status !== ReportStatus.RESOLVED && input.status !== ReportStatus.DISMISSED) || note.length < 10 || note.length > 500) {
      throw new ReportValidationError('Invalid moderation decision or note.');
    }
    const updated = await this.prisma.contentReport.updateMany({
      where: { id: input.id, status: ReportStatus.OPEN },
      data: { status: input.status, reviewerId, moderatorNote: note, reviewedAt: new Date() },
    });
    if (updated.count === 0) throw new ReportConflictError('Report not found or already reviewed.');
    const report = await this.prisma.contentReport.findUnique({ where: { id: input.id }, select: moderationSelect });
    if (!report) throw new ReportTargetUnavailableError('Report not found.');
    return report;
  }

  private pageInfo(page: number, perPage: number, total: number) {
    const pageCount = Math.ceil(total / perPage);
    return { page, perPage, total, pageCount, hasNextPage: page < pageCount, hasPreviousPage: page > 1 };
  }
}
