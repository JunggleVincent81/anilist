import { BadRequestException, Injectable } from '@nestjs/common';
import { AnimeCatalogStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';
import { AdminCatalogAgeFilter } from './admin-catalog.graphql.js';
import type { AdminCatalogPageInput } from './admin-catalog.graphql.js';

@Injectable()
export class AdminCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const [total, included, review, excluded, unverifiedAge, emptySynopsis, missingCover, curationRequests] = await Promise.all([
      this.prisma.anime.count(),
      this.prisma.anime.count({ where: { catalogStatus: AnimeCatalogStatus.INCLUDED } }),
      this.prisma.anime.count({ where: { catalogStatus: AnimeCatalogStatus.REVIEW } }),
      this.prisma.anime.count({ where: { catalogStatus: AnimeCatalogStatus.EXCLUDED } }),
      this.prisma.anime.count({ where: { isAdult: null } }),
      this.prisma.anime.count({ where: { OR: [{ description: null }, { description: '' }] } }),
      this.prisma.anime.count({ where: { OR: [{ coverImageUrl: null }, { coverImageUrl: '' }] } }),
      this.prisma.catalogChangeRequest.count(),
    ]);
    return { total, included, review, excluded, unverifiedAge, emptySynopsis, missingCover, curationRequests };
  }

  async page(input?: AdminCatalogPageInput) {
    const page = input?.page ?? 1;
    const perPage = input?.perPage ?? 20;
    const search = input?.search?.trim() ?? '';
    if (!Number.isInteger(page) || page < 1 || page > 100_000 || !Number.isInteger(perPage) || perPage < 1 || perPage > 100 || (page - 1) * perPage > 100_000) {
      throw new BadRequestException('Invalid admin catalog pagination.');
    }
    if (search.length > 120) throw new BadRequestException('Search term is too long.');
    if (input?.status && !Object.values(AnimeCatalogStatus).includes(input.status)) {
      throw new BadRequestException('Invalid catalog status.');
    }
    if (input?.age && !Object.values(AdminCatalogAgeFilter).includes(input.age)) {
      throw new BadRequestException('Invalid age filter.');
    }
    const where: Prisma.AnimeWhereInput = {
      ...(input?.status ? { catalogStatus: input.status } : {}),
      ...(input?.age === AdminCatalogAgeFilter.UNKNOWN ? { isAdult: null } : {}),
      ...(input?.age === AdminCatalogAgeFilter.ADULT ? { isAdult: true } : {}),
      ...(input?.age === AdminCatalogAgeFilter.NON_ADULT ? { isAdult: false } : {}),
      ...(search ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { titleRomaji: { contains: search, mode: 'insensitive' as const } },
          { titleEnglish: { contains: search, mode: 'insensitive' as const } },
          { titleNative: { contains: search, mode: 'insensitive' as const } },
          { slug: { contains: search, mode: 'insensitive' as const } },
        ],
      } : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.anime.count({ where }),
      this.prisma.anime.findMany({
        where,
        select: { id: true, slug: true, title: true, format: true, catalogStatus: true, seasonYear: true, isAdult: true, description: true, coverImageUrl: true },
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);
    const pageCount = Math.ceil(total / perPage);
    return {
      items: rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        format: row.format,
        catalogStatus: row.catalogStatus,
        seasonYear: row.seasonYear,
        isAdult: row.isAdult,
        hasSynopsis: Boolean(row.description?.trim()),
        hasCover: Boolean(row.coverImageUrl?.trim()),
        synopsisPreview: row.description?.trim().slice(0, 220) || null,
      })),
      pageInfo: { page, perPage, total, pageCount, hasNextPage: page < pageCount, hasPreviousPage: page > 1 },
    };
  }
}
