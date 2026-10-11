import 'reflect-metadata';
import { describe, expect, it, jest } from '@jest/globals';
import { UserRole } from '@prisma/client';
import type { PrismaService } from '../database/prisma.service.js';
import { ROLES_KEY } from '../auth/authorization/roles.decorator.js';
import { RolesGuard } from '../auth/authorization/roles.guard.js';
import { AdminCatalogResolver } from './admin-catalog.resolver.js';
import { AdminDomainKind, AdminPublicationFilter } from './admin-domain-records.graphql.js';
import { AdminDomainRecordsService } from './admin-domain-records.service.js';

function fixture() {
  const calls: string[] = [];
  const row = {
    id: '00000000-0000-4000-8000-000000000100', title: 'Synthetic', slug: 'synthetic',
    displayName: 'Synthetic artist', artistKey: 'artist-key', volumeKey: 'v1', chapterKey: 'c1',
    chapterType: 'REGULAR', number: null, artistName: 'Demo', category: 'OPENING',
    recordingKey: 'rec', versionLabel: null, releaseKey: 'rel', releaseType: 'ALBUM',
    role: 'VOCAL', creditedAs: null, kind: 'RECORDING', trackNumber: 1, discNumber: 1,
    mangaWorkId: '00000000-0000-4000-8000-000000000101', releaseId: '00000000-0000-4000-8000-000000000102',
    artistId: '00000000-0000-4000-8000-000000000103', animeId: null,
    animeMusicTrackId: null, sourceName: 'Manual test', sourceReference: 'synthetic://fixture',
    isAdult: null, isPublished: false, createdAt: new Date('2026-10-11T00:00:00Z'),
  };
  const db: Record<string, unknown> = {};
  for (const name of ['mangaWork','mangaVolume','mangaChapter','animeMusicTrack','musicArtist','musicRecording','musicRelease','musicReleaseTrack','musicCredit']) {
    db[name] = {
      count: jest.fn(async (..._args: unknown[]) => { calls.push(`${name}.count`); return 1; }),
      findMany: jest.fn(async (..._args: unknown[]) => { calls.push(`${name}.findMany`); return [row]; }),
    };
  }
  return { db, calls, service: new AdminDomainRecordsService(db as unknown as PrismaService) };
}

describe('P16-W03 private canonical Manga/Music inventory', () => {
  it('requires ADMIN guard; does not make any mutation endpoint', () => {
    const method = AdminCatalogResolver.prototype.adminDomainRecordPage;
    expect(Reflect.getMetadata(ROLES_KEY, method)).toEqual([UserRole.ADMIN]);
    expect(Reflect.getMetadata('__guards__', method)).toContain(RolesGuard);
  });
  it('reads all nine canonical structures using only count/findMany', async () => {
    const x = fixture();
    for (const domain of Object.values(AdminDomainKind)) {
      const result = await x.service.page({domain, page:1, perPage:10, publication:AdminPublicationFilter.PRIVATE});
      expect(result.available).toBe(true);
      expect(result.total).toBe(1);
      expect(result.items[0]?.isPublished).toBe(false);
      expect(result.items[0]?.id).toBeTruthy();
    }
    expect(x.calls).toHaveLength(18);
    expect(x.calls.every(c => c.endsWith('.count') || c.endsWith('.findMany'))).toBe(true);
  });
  it('limits pagination, search and allowed enums before touching Prisma', async () => {
    const x = fixture();
    await expect(x.service.page({ domain: 'NOT_REAL' as AdminDomainKind })).rejects.toThrow();
    await expect(x.service.page({ domain: AdminDomainKind.MANGA_WORK, page: 0 })).rejects.toThrow();
    await expect(x.service.page({ domain: AdminDomainKind.MUSIC_CREDIT, perPage: 51 })).rejects.toThrow();
    await expect(x.service.page({ domain: AdminDomainKind.MANGA_WORK, page: 3000, perPage: 50 })).rejects.toThrow();
    await expect(x.service.page({ domain: AdminDomainKind.MANGA_WORK, search: 'x'.repeat(121) })).rejects.toThrow();
    await expect(x.service.page({ domain: AdminDomainKind.MANGA_WORK, publication: 'RELEASE_NOW' as AdminPublicationFilter })).rejects.toThrow();
    expect(x.calls).toHaveLength(0);
  });
  it('reports missing migration as unavailable, not empty database', async () => {
    const x = fixture();
    (x.db.musicArtist as {count: ReturnType<typeof jest.fn>}).count.mockImplementationOnce(async () => { throw {code:'P2021'}; });
    const result = await x.service.page({domain:AdminDomainKind.MUSIC_ARTIST});
    expect(result.available).toBe(false);
    expect(result.total).toBeNull();
    expect(result.items).toEqual([]);
  });
  it('propagates non-migration database errors', async () => {
    const x = fixture();
    (x.db.mangaWork as {count: ReturnType<typeof jest.fn>}).count.mockImplementationOnce(async () => { throw new Error('db unavailable'); });
    await expect(x.service.page({domain:AdminDomainKind.MANGA_WORK})).rejects.toThrow('db unavailable');
  });
  it('filters unpublished state without changing it', async () => {
    const x = fixture();
    await x.service.page({domain:AdminDomainKind.MANGA_WORK, publication:AdminPublicationFilter.PRIVATE, search:'synthetic'});
    const fn = (x.db.mangaWork as {findMany: ReturnType<typeof jest.fn>}).findMany;
    const args = fn.mock.calls[0] as unknown as [{where:{isPublished:boolean,OR:unknown[]}}];
    expect(args[0].where.isPublished).toBe(false);
    expect(args[0].where.OR.length).toBeGreaterThan(0);
  });
});
