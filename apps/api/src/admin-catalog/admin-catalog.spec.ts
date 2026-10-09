import 'reflect-metadata';
import { describe, expect, it } from '@jest/globals';
import { AnimeCatalogStatus, UserRole } from '@prisma/client';
import { ROLES_KEY } from '../auth/authorization/roles.decorator.js';
import { RolesGuard } from '../auth/authorization/roles.guard.js';
import type { PrismaService } from '../database/prisma.service.js';
import { AdminCatalogAgeFilter } from './admin-catalog.graphql.js';
import { AdminCatalogResolver } from './admin-catalog.resolver.js';
import { AdminCatalogService } from './admin-catalog.service.js';

describe('AN-140C protected read-only admin catalog', () => {
  it('requires ADMIN (not MODERATOR) for both GraphQL queries', () => {
    for (const method of ['adminCatalogOverview', 'adminCatalogPage'] as const) {
      const resolverMethod = AdminCatalogResolver.prototype[method];
      expect(Reflect.getMetadata(ROLES_KEY, resolverMethod)).toEqual([UserRole.ADMIN]);
      expect(Reflect.getMetadata('__guards__', resolverMethod)).toContain(RolesGuard);
    }
  });

  it('never publishes or writes anime while reading', async () => {
    const calls: Array<{ name: string; args?: unknown }> = [];
    const prisma = {
      anime: {
        count: async (args?: unknown) => { calls.push({ name: 'count', args }); return 3; },
        findMany: async (args?: unknown) => {
          calls.push({ name: 'findMany', args });
          return [{ id: 'abc', slug: 'anime-slug', title: 'Anime', format: 'TV', catalogStatus: AnimeCatalogStatus.REVIEW,
            seasonYear: 2026, isAdult: null, description: null, coverImageUrl: null }];
        },
      },
      catalogChangeRequest: { count: async () => { calls.push({ name: 'requests.count' }); return 0; } },
    } as unknown as PrismaService;
    const service = new AdminCatalogService(prisma);
    const overview = await service.overview();
    expect(overview.unverifiedAge).toBe(3);
    expect(overview.curationRequests).toBe(0);
    const page = await service.page({ page: 1, perPage: 20, status: AnimeCatalogStatus.REVIEW, age: AdminCatalogAgeFilter.UNKNOWN });
    expect(page.items[0]?.isAdult).toBeNull();
    expect(page.items[0]?.hasCover).toBe(false);
    expect(page.items[0]?.synopsisPreview).toBeNull();
    expect(calls.every((call) => ['count', 'findMany', 'requests.count'].includes(call.name))).toBe(true);
    const finder = calls.find((call) => call.name === 'findMany')?.args as { where: { catalogStatus: AnimeCatalogStatus; isAdult: null }; take: number };
    expect(finder.where.catalogStatus).toBe(AnimeCatalogStatus.REVIEW);
    expect(finder.where.isAdult).toBeNull();
    expect(finder.take).toBe(20);
  });

  it('bounds pagination and search server-side', async () => {
    const service = new AdminCatalogService({} as PrismaService);
    await expect(service.page({ page: 0 })).rejects.toThrow();
    await expect(service.page({ perPage: 101 })).rejects.toThrow();
    await expect(service.page({ page: 6000, perPage: 30 })).rejects.toThrow();
    await expect(service.page({ search: 'x'.repeat(121) })).rejects.toThrow();
  });
});
