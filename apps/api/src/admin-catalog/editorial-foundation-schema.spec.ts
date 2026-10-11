import { readFileSync } from 'node:fs';
import { describe, expect, it } from '@jest/globals';

const schema = readFileSync(new URL('../../prisma/schema.prisma', import.meta.url), 'utf8');
const migration = readFileSync(
  new URL('../../prisma/migrations/20261011120000_an160_editorial_staging_foundation/migration.sql', import.meta.url),
  'utf8',
);
const block = (name: string) => {
  const found = schema.match(new RegExp('^model ' + name + ' \\{[\\s\\S]*?^\\}', 'm'));
  expect(found).not.toBeNull();
  return found?.[0] ?? '';
};

describe('AN-160A private editorial domain foundation', () => {
  it('adds private candidate and generic case, retaining the legacy request model', () => {
    expect(block('CatalogCandidate')).toContain('isQuarantined Boolean @default(true)');
    expect(block('CatalogCandidate')).toContain('sourcePayload Json');
    expect(block('EditorialCase')).toContain('legacyChangeRequestId String? @unique @db.Uuid');
    expect(block('CatalogChangeRequest')).toContain('editorialCase EditorialCase?');
  });
  it('protects legacy identity and requires manual canonical publication', () => {
    expect(block('EditorialCase')).toContain('canonicalEntityId String? @db.Uuid');
    expect(block('EditorialCase')).not.toContain('isPublished');
    expect(block('CatalogCandidate')).not.toContain('isPublished');
    expect(migration).not.toMatch(/\b(?:INSERT\s+INTO|DELETE\s+FROM|TRUNCATE)\b|\bUPDATE\s+"Anime"/i);
  });
  it('prepares only additive private SQL objects and restrictive relationships', () => {
    expect(migration).toContain('CREATE TABLE "CatalogCandidate"');
    expect(migration).toContain('CREATE TABLE "EditorialCase"');
    expect(migration).toContain('REFERENCES "CatalogChangeRequest"("id") ON DELETE RESTRICT');
    expect(migration).toContain('"isQuarantined" BOOLEAN NOT NULL DEFAULT true');
    expect(migration).toContain('"EditorialCase_revision_positive" CHECK ("revision" > 0)');
  });
});
