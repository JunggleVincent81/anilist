import 'reflect-metadata';
import { describe, expect, it, jest } from '@jest/globals';
import { UserRole } from '@prisma/client';
import type { PrismaService } from '../database/prisma.service.js';
import { ROLES_KEY } from '../auth/authorization/roles.decorator.js';
import { RolesGuard } from '../auth/authorization/roles.guard.js';
import { AdminCatalogResolver } from './admin-catalog.resolver.js';
import { AdminWorkspaceOverviewService } from './admin-workspace-overview.service.js';

function mockCounts() {
  const count = () => jest.fn(async (_args?: unknown) => 0);
  return {
    mangaWork: { count: count() }, mangaVolume: { count: count() }, mangaChapter: { count: count() },
    animeMusicTrack: { count: count() }, musicArtist: { count: count() },
    musicRecording: { count: count() }, musicRelease: { count: count() }, musicCredit: { count: count() },
    catalogCandidate: { count: count() }, editorialCase: { count: count() },
  };
}

describe('P16-W01 private cross-domain overview', () => {
  it('only exposes the new resolver query to ADMIN', () => {
    const method = AdminCatalogResolver.prototype.adminWorkspaceOverview;
    expect(Reflect.getMetadata(ROLES_KEY, method)).toEqual([UserRole.ADMIN]);
    expect(Reflect.getMetadata('__guards__', method)).toContain(RolesGuard);
  });

  it('reports true zero counts for available empty domains without modifying data', async () => {
    const db = mockCounts();
    const result = await new AdminWorkspaceOverviewService(db as unknown as PrismaService).overview();
    expect(result.manga).toEqual({ available: true, works: 0, volumes: 0, chapters: 0 });
    expect(result.music).toEqual({ available: true, tracks: 0, artists: 0, recordings: 0, releases: 0, credits: 0 });
    expect(result.editorial).toEqual({ available: true, candidates: 0, quarantined: 0, cases: 0, submitted: 0, underReview: 0, approved: 0 });
    expect(db.catalogCandidate.count).toHaveBeenCalledWith({ where: { isQuarantined: true } });
    expect(db.editorialCase.count).toHaveBeenCalledWith({ where: { state: 'UNDER_REVIEW' } });
  });

  it('never fakes zero for unavailable schema, yet preserves other domain metrics', async () => {
    const db = mockCounts();
    db.mangaWork.count.mockRejectedValueOnce(new Error('relation does not exist'));
    db.editorialCase.count.mockRejectedValueOnce(new Error('relation does not exist'));
    const result = await new AdminWorkspaceOverviewService(db as unknown as PrismaService).overview();
    expect(result.manga).toEqual({ available: false, works: null, volumes: null, chapters: null });
    expect(result.editorial).toEqual({ available: false, candidates: null, quarantined: null,
      cases: null, submitted: null, underReview: null, approved: null });
    expect(result.music.available).toBe(true);
    expect(result.music.tracks).toBe(0);
  });

  it('distinguishes real counts and reads only aggregate count methods', async () => {
    const db = mockCounts();
    db.mangaWork.count.mockResolvedValueOnce(12);
    db.musicRecording.count.mockResolvedValueOnce(5);
    db.catalogCandidate.count.mockResolvedValueOnce(10).mockResolvedValueOnce(7);
    db.editorialCase.count.mockResolvedValueOnce(9).mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2).mockResolvedValueOnce(1);
    const result = await new AdminWorkspaceOverviewService(db as unknown as PrismaService).overview();
    expect(result.manga.works).toBe(12);
    expect(result.music.recordings).toBe(5);
    expect(result.editorial).toMatchObject({ candidates: 10, quarantined: 7,
      cases: 9, submitted: 3, underReview: 2, approved: 1 });
    for (const obj of Object.values(db)) expect(Object.keys(obj)).toEqual(['count']);
  });
});
