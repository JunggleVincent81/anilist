# AN-124 — User Reports & Moderation Queue V1

Date: 2026-10-09
Scope: Phase 10 — Social, Community & Production

## Reporting
- Any authenticated user may submit reports against PUBLIC or otherwise visible activities, anime reviews, and public user profiles.
- A user may not report their own content/profile.
- Allowed reasons: SPAM, HARASSMENT, HATE_SPEECH, SEXUAL_CONTENT, VIOLENCE, OTHER.
- Optional description: 500 characters maximum, trimmed.
- Duplicate reports against the same target by the same user are blocked by database uniqueness.
- Up to 20 new reports per user in a rolling 24-hour window.
- Reports reference targetType/targetId polymorphically; removed targets can leave a moderation record.
- Reports are not public. Each reporter can read only their own receipts without internal notes.

## Staff Triage
- Only MODERATOR or ADMIN can query the moderation queue or decide cases.
- Queue defaults to OPEN; supports status and pagination filters, 20/page default, 100/page maximum.
- OPEN -> RESOLVED or DISMISSED exactly once using an atomic status-scoped update.
- Decisions require a moderator note (10–500 characters, trimmed), reviewer identity, and timestamp.
- Moderators see reporter identity, but reporters never receive internal notes.
- Existing activity privacy settings are respected when users submit reports.
- No auto-deletion, account suspension, quarantine, or automated punitive decision in V1.

## GraphQL
Mutations:
- submitContentReport(input: SubmitContentReportInput!): ContentReportReceiptType!
- resolveContentReport(input: ResolveContentReportInput!): ModerationReportType! [MODERATOR, ADMIN]

Queries:
- myContentReports(input: ReportPageInput): MyContentReportsPageType! [authenticated]
- moderationReports(input: ModerationQueueInput): ModerationReportsPageType! [MODERATOR, ADMIN]

## Data
ContentReport: reporter, targetType, targetId, reason, details, status, reviewer, moderatorNote, timestamps.
Migration: add_content_reports; preserved existing user, review, activity and notification records.

## Follow-up
Case enforcement/takedown UI, appeals, moderation audit history, and staff workflow dashboard are separate future work. Staff must not treat RESOLVED alone as confirmation that reported content was removed.
