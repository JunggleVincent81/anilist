import { readFileSync } from 'node:fs';
import { describe, expect, it } from '@jest/globals';
const schema = readFileSync(new URL('../../prisma/schema.prisma', import.meta.url), 'utf8');
const sql = readFileSync(new URL('../../prisma/migrations/20261011133000_an162_editorial_transition_ledger/migration.sql', import.meta.url), 'utf8');
const model = schema.match(/^model EditorialCaseTransition \{[\s\S]*?^\}/m)?.[0] ?? '';
describe('AN-162A private append-only transition ledger', () => {
  it('links every transition to a case and a real actor without changing legacy tables', () => {
    expect(model).toContain('editorialCase EditorialCase @relation(');
    expect(model).toContain('actor User @relation(');
    expect(model).toContain('@@unique([caseId, nextRevision])');
    expect(schema).toContain('transitions EditorialCaseTransition[]');
    expect(schema).toContain('editorialCaseTransitions EditorialCaseTransition[]');
  });
  it('stores from/to state, action, monotonic revision, policy version and bounded human note', () => {
    for (const field of ['action EditorialTransitionAction', 'fromState EditorialCaseState',
      'toState EditorialCaseState', 'previousRevision Int', 'nextRevision Int',
      'policyVersion String @db.VarChar(60)', 'note String? @db.VarChar(2000)']) {
      expect(model).toContain(field);
    }
    expect(sql).toContain('"EditorialCaseTransition_revision_chain" CHECK');
    expect(sql).toContain('"EditorialCaseTransition_action_state" CHECK');
    expect(sql).toContain('"EditorialCaseTransition_human_review_note" CHECK');
  });
  it('enforces restrictive foreign keys and database-level append-only history', () => {
    expect(sql).toContain('CREATE TRIGGER "EditorialCaseTransition_append_only"');
    expect(sql).toContain('BEFORE UPDATE OR DELETE ON "EditorialCaseTransition"');
    expect(sql).toContain('ON DELETE RESTRICT ON UPDATE CASCADE');
    expect(sql).toContain('CREATE TABLE "EditorialCaseTransition"');
    expect(sql).not.toMatch(/\b(?:INSERT\s+INTO|TRUNCATE)\b|\bUPDATE\s+"(?:Anime|EditorialCase|CatalogChangeRequest)"\s+SET/i);
  });
});
