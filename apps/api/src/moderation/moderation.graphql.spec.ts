import { describe, expect, it } from '@jest/globals';
import { validateSync } from 'class-validator';
import { ReportReason, ReportStatus, ReportTargetType } from '@prisma/client';
import { ModerationQueueInput, ReportPageInput, ResolveContentReportInput, SubmitContentReportInput } from './moderation.graphql.js';
const validUUID = '11111111-1111-4111-8111-111111111111';

describe('AN-124 GraphQL DTO validation', () => {
  it('accepts report input', () => {
    expect(validateSync(Object.assign(new SubmitContentReportInput(), { targetId: validUUID, targetType: ReportTargetType.ACTIVITY, reason: ReportReason.SPAM }))).toHaveLength(0);
  });
  it('rejects missing or invalid report fields', () => {
    expect(validateSync(Object.assign(new SubmitContentReportInput(), { targetId: 'bad', targetType: 'INVALID', reason: ReportReason.SPAM }))).not.toHaveLength(0);
  });
  it('rejects invalid page and status', () => {
    expect(validateSync(Object.assign(new ReportPageInput(), { perPage: 101 }))).not.toHaveLength(0);
    expect(validateSync(Object.assign(new ModerationQueueInput(), { status: 'INVALID' }))).not.toHaveLength(0);
  });
  it('requires sufficiently descriptive moderation note', () => {
    expect(validateSync(Object.assign(new ResolveContentReportInput(), { id: validUUID, status: ReportStatus.RESOLVED, note: 'short' }))).not.toHaveLength(0);
    expect(validateSync(Object.assign(new ResolveContentReportInput(), { id: validUUID, status: ReportStatus.RESOLVED, note: 'Reviewed and approved decision.' }))).toHaveLength(0);
  });
});
