import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CatalogChangeKind, CatalogChangeState, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';
import type { CreateAdminSynopsisDraftInput, UpdateAdminSynopsisDraftInput } from './admin-synopsis-draft.graphql.js';

function cleanSynopsis(raw: string): string {
  if (typeof raw !== 'string') throw new BadRequestException('Synopsis is required.');
  const value = raw.trim();
  // eslint-disable-next-line no-control-regex -- Intentionally reject unsafe control characters.
  if (!value || value.length > 10000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) {
    throw new BadRequestException('Synopsis must contain 1–10000 valid text characters.');
  }
  return value;
}
function cleanReason(raw?: string): string | null {
  if (raw === undefined) return null;
  if (typeof raw !== 'string' || raw.trim().length > 500) throw new BadRequestException('Invalid reason.');
  return raw.trim() || null;
}
function present(row: { id: string; animeId: string; revision: number; proposedPatch: Prisma.JsonValue; reason: string | null; createdAt: Date; updatedAt: Date }) {
  const patch = row.proposedPatch;
  if (!patch || typeof patch !== 'object' || Array.isArray(patch) || typeof patch.synopsis !== 'string') {
    throw new ConflictException('Draft has an unsupported patch shape.');
  }
  return { id: row.id, animeId: row.animeId, revision: row.revision, synopsis: patch.synopsis, reason: row.reason, createdAt: row.createdAt, updatedAt: row.updatedAt };
}
@Injectable()
export class AdminSynopsisDraftService {
  constructor(private readonly prisma: PrismaService) {}

  async create(actorId: string, input: CreateAdminSynopsisDraftInput) {
    const synopsis = cleanSynopsis(input.synopsis);
    const reason = cleanReason(input.reason);
    const anime = await this.prisma.anime.findUnique({ where: { id: input.animeId }, select: { id: true, updatedAt: true } });
    if (!anime) throw new NotFoundException('Anime not found.');
    const row = await this.prisma.catalogChangeRequest.create({ data: {
      animeId: anime.id, creatorId: actorId, kind: CatalogChangeKind.SYNOPSIS,
      state: CatalogChangeState.DRAFT, baseAnimeUpdatedAt: anime.updatedAt,
      proposedPatch: { synopsis }, reason,
    } });
    return present(row);
  }

  async mine(actorId: string, draftId: string) {
    const row = await this.prisma.catalogChangeRequest.findFirst({ where: {
      id: draftId, creatorId: actorId, kind: CatalogChangeKind.SYNOPSIS, state: CatalogChangeState.DRAFT,
    } });
    if (!row) throw new NotFoundException('Draft not found.');
    return present(row);
  }

  async update(actorId: string, input: UpdateAdminSynopsisDraftInput) {
    if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 1 || input.expectedRevision > 2147483646) {
      throw new BadRequestException('Invalid expected revision.');
    }
    const synopsis = cleanSynopsis(input.synopsis);
    const reason = cleanReason(input.reason);
    const result = await this.prisma.catalogChangeRequest.updateMany({
      where: { id: input.draftId, creatorId: actorId, kind: CatalogChangeKind.SYNOPSIS,
        state: CatalogChangeState.DRAFT, revision: input.expectedRevision },
      data: { revision: { increment: 1 }, proposedPatch: { synopsis }, ...(input.reason === undefined ? {} : { reason }) },
    });
    if (result.count !== 1) throw new ConflictException('Draft missing, inaccessible, or changed. Refresh before editing.');
    return this.mine(actorId, input.draftId);
  }
}
