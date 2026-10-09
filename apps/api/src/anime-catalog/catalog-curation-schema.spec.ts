import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const prisma = readFileSync(join(process.cwd(), 'prisma/schema.prisma'), 'utf8');
const migration = readFileSync(join(process.cwd(), 'prisma/migrations/20261009180000_an140b_catalog_curation_foundation/migration.sql'), 'utf8');
const entities = ['CatalogChangeRequest', 'CatalogEvidence', 'CatalogReviewDecision', 'CatalogAsset', 'CatalogRevision', 'CatalogProductionCountry'];

describe('AN-140B private catalog-curation persistence foundation', () => {
  it('adds six non-public models, not a second Anime table', () => {
    for (const entity of entities) {
      expect(prisma).toContain(`model ${entity} {`);
      expect(migration).toContain(`CREATE TABLE "${entity}"`);
    }
    expect(prisma.match(/model Anime \{/g)).toHaveLength(1);
  });
  it('preserves independent change tracking and optimistic revision', () => {
    expect(prisma).toMatch(/model CatalogChangeRequest \{[\s\S]*?baseAnimeUpdatedAt DateTime[\s\S]*?revision Int @default\(1\)/);
    expect(prisma).toContain('state CatalogChangeState @default(DRAFT)');
  });
  it('provides evidence and separately attributed review decisions', () => {
    expect(prisma).toContain('kind CatalogEvidenceKind');
    expect(prisma).toContain('actor User @relation("CatalogReviewActor"');
    expect(prisma).toContain('@@unique([changeRequestId, actorId, reviewTrack, draftRevision])');
  });
  it('stores private asset keys without deriving an approved cover URL', () => {
    expect(prisma).toContain('state CatalogAssetState @default(STAGED)');
    expect(prisma).toContain('licenseEvidenceId String? @db.Uuid');
    expect(prisma).not.toContain('imagePublicApproved Boolean @default(true)');
  });
  it('separates proposed country evidence from canonical Anime properties', () => {
    expect(prisma).toContain('model CatalogProductionCountry {');
    expect(prisma).toContain('@@unique([changeRequestId, countryCode])');
  });
  it('must not modify or destroy pre-existing tables with migration SQL', () => {
    // Referential actions are SQL DDL, not deletion executed during migration.
    // Check executable statements instead of banning the words DELETE / UPDATE.
    const statements = migration.replace(/^--.*$/gm, '').split(';').map((x) => x.trim()).filter(Boolean);
    expect(statements.length).toBeGreaterThanOrEqual(20);
    const allowed = [
      /^CREATE TYPE "Catalog[^"]+" AS ENUM\s*\(/s,
      /^CREATE TABLE "Catalog[^"]+"\s*\(/s,
      /^CREATE (?:UNIQUE )?INDEX "[^"]+" ON "Catalog[^"]+"\s*\(/s,
      /^ALTER TABLE "Catalog[^"]+" ADD CONSTRAINT "[^"]+" FOREIGN KEY\s*\(/s,
    ];
    for (const statement of statements) {
      expect(allowed.some((rx) => rx.test(statement))).toBe(true);
      expect(statement).not.toMatch(/\b(?:DROP|TRUNCATE|RENAME)\b/i);
      expect(statement).not.toMatch(/^(?:DELETE\s+FROM|UPDATE\s+\S+\s+SET|INSERT\s+INTO|MERGE\s+INTO|CREATE\s+OR\s+REPLACE)\b/i);
      expect(statement).not.toMatch(/\bON\s+DELETE\s+(?:CASCADE|SET\s+NULL|SET\s+DEFAULT)\b/i);
      if (statement.startsWith('ALTER TABLE ')) {
        expect(statement).toMatch(/\bON\s+DELETE\s+RESTRICT\b/i);
      }
    }
    expect(migration).not.toMatch(/ALTER TABLE "(?:Anime|User|ExternalAnimeId|AnimeListEntry|AnimeFavorite|AnimeReview)"/);
    const tableNames = [...migration.matchAll(/CREATE TABLE "([^"]+)"/g)].map((x) => x[1]).sort();
    expect(tableNames).toEqual([...entities].sort());
  });
  it('does not add a publishing mutation or automatic age unlock', () => {
    expect(prisma).toContain('isAdult Boolean?');
    expect(prisma).toContain('catalogStatus AnimeCatalogStatus @default(REVIEW)');
    expect(prisma).not.toMatch(/isAdult Boolean @default\(false\)/);
  });
});
