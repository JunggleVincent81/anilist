import { Injectable } from '@nestjs/common';
import { CatalogChangeKind, CatalogChangeState } from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class AdminSynopsisQueueService {
  constructor(private readonly prisma: PrismaService) {}

  async page(page: number) {
    const safePage = Number.isSafeInteger(page) ? Math.min(Math.max(page, 1), 10000) : 1;
    const perPage = 20;
    const where = { kind: CatalogChangeKind.SYNOPSIS, state: { in: [CatalogChangeState.SUBMITTED, CatalogChangeState.UNDER_REVIEW] } };
    const [total, rows] = await Promise.all([
      this.prisma.catalogChangeRequest.count({ where }),
      this.prisma.catalogChangeRequest.findMany({
        where,
        select: { id: true, animeId: true, creatorId: true, revision: true, state: true,
          proposedPatch: true, reason: true, createdAt: true, submittedAt: true },
        orderBy: [{ submittedAt: 'asc' }, { id: 'asc' }],
        skip: (safePage - 1) * perPage, take: perPage,
      }),
    ]);
    return {
      page: safePage, perPage, total, hasNextPage: safePage * perPage < total,
      items: rows.map((row) => {
        const patch = row.proposedPatch;
        // Untrusted imported JSON may not conform to the synopsis patch contract.
        const synopsis = patch && typeof patch === 'object' && !Array.isArray(patch) && typeof patch.synopsis === 'string'
          ? patch.synopsis : '[Unsupported synopsis patch]';
        return { ...row, synopsis };
      }),
    };
  }
}
