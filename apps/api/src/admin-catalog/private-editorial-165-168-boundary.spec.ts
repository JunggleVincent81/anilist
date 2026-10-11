import { readFileSync } from 'node:fs';
import { describe, expect, it } from '@jest/globals';

const read = (url: string) => readFileSync(new URL(url, import.meta.url), 'utf8');
const schema = read('../../prisma/schema.prisma');
const enumSql = read('../../prisma/migrations/20261011180000_an165a_approve_enum/migration.sql');
const approvalSql = read('../../prisma/migrations/20261011180100_an165b_synopsis_approval/migration.sql');
const commitSql = read('../../prisma/migrations/20261011183000_an166_synopsis_commit/migration.sql');

describe('AN-168 static boundary + additive SQL contract', () => {
  it('keeps internal services out of NestJS module/resolver registration and legacy routes', () => {
    const moduleCode = read('./admin-catalog.module.ts');
    const resolverCode = read('./admin-catalog.resolver.ts');
    for (const code of [moduleCode, resolverCode]) {
      expect(code).not.toMatch(/PrivateEditorialApprovalService|PrivateAnimeSynopsisCommitService|EditorialSynopsisApproval|EditorialSynopsisCommit/);
    }
    const legacy = read('./admin-synopsis-review.service.ts');
    expect(legacy).not.toMatch(/PrivateAnimeSynopsisCommitService|PrivateEditorialApprovalService/);
  });
  it('adds a separate enum migration before using APPROVE in constraint expressions', () => {
    expect(enumSql).toContain('ADD VALUE \'APPROVE\'');
    expect(approvalSql).toContain('"action" = \'APPROVE\' AND "fromState" = \'UNDER_REVIEW\' AND "toState" = \'APPROVED\'');
    expect(approvalSql).toContain("'REQUEST_CHANGES','REJECT','APPROVE'");
    expect(schema).toContain('APPROVE');
  });
  it('adds source-bound evidence and separate restrictive, append-only approval/commit history', () => {
    for (const table of ['EditorialSynopsisEvidence', 'EditorialSynopsisApproval']) {
      expect(approvalSql).toContain(`CREATE TABLE "${table}"`);
    }
    expect(commitSql).toContain('CREATE TABLE "EditorialSynopsisCommit"');
    expect(approvalSql).toContain('BEFORE UPDATE OR DELETE ON "EditorialSynopsisEvidence"');
    expect(approvalSql).toContain('EditorialSynopsisEvidence is immutable except revocation');
    expect(approvalSql).toContain('BEFORE UPDATE OR DELETE ON "EditorialSynopsisApproval"');
    expect(commitSql).toContain('BEFORE UPDATE OR DELETE ON "EditorialSynopsisCommit"');
    expect(approvalSql).toContain('"EditorialSynopsisApproval_caseId_key"');
    expect(commitSql).toContain('"EditorialSynopsisCommit_caseId_key"');
    for (const sql of [enumSql, approvalSql, commitSql]) {
      expect(sql).not.toMatch(/\b(?:INSERT\s+INTO|TRUNCATE)\b|\bUPDATE\s+"Anime"\s+SET/i);
    }
  });
  it('retains permanent BLOCKED decisions in AN-163 and AN-164 contracts', () => {
    const publication = read('./editorial-publication-gates.ts');
    const design = read('./anime-synopsis-approval-commit-contract.ts');
    expect(publication).toContain('canPublish: false');
    expect(publication).toContain('canWriteCanonical: false');
    expect(design).toContain("status: 'BLOCKED'");
    expect(design).toContain('canApprove: false');
  });
});
