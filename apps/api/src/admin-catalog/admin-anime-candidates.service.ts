import { BadRequestException, ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';
import type { AdminAnimeCandidatePageInput, CreateAdminAnimeCandidateInput, UpdateAdminAnimeCandidateInput } from './admin-anime-candidates.graphql.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function clean(value: unknown, label: string, max: number): string {
  if (typeof value !== 'string') throw new BadRequestException(`Invalid ${label}.`);
  const text = value.trim();
  // eslint-disable-next-line no-control-regex -- Reject untrusted control characters.
  if (!text || text.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text)) {
    throw new BadRequestException(`Invalid ${label}.`);
  }
  return text;
}

function normalize(input: CreateAdminAnimeCandidateInput) {
  if (!input) throw new BadRequestException('Candidate input is required.');
  return { sourceName: clean(input.sourceName, 'source name', 150),
    sourceReference: clean(input.sourceReference, 'source reference', 500),
    synopsis: clean(input.synopsis, 'synopsis', 10000) };
}

type CandidateRow = {
  id: string; subjectType: string; sourceName: string; sourceReference: string; sourcePayload: Prisma.JsonValue; normalizedPayload: Prisma.JsonValue | null; fingerprint: string | null;
  isQuarantined: boolean; creatorId: string | null; createdAt: Date; updatedAt: Date;
  _count?: { editorialCases: number; synopsisEvidence: number };
};

function isManualDraft(row: CandidateRow): boolean {
  const payload = row.sourcePayload;
  return row.fingerprint === null && !!payload && typeof payload === 'object' &&
    !Array.isArray(payload) && payload.entryType === 'MANUAL_ANIME_DRAFT' &&
    payload.sourceReference === row.sourceReference;
}

function present(row: CandidateRow, actorId: string) {
  const payload = row.normalizedPayload;
  const synopsis = payload && typeof payload === 'object' && !Array.isArray(payload) &&
    Object.keys(payload).length === 1 && typeof payload.synopsis === 'string' ? payload.synopsis : null;
  return { id: row.id, sourceName: row.sourceName, sourceReference: row.sourceReference,
    synopsis, isQuarantined: row.isQuarantined,
    editable: isManualDraft(row) && row.subjectType === 'ANIME' && row.isQuarantined && row.creatorId === actorId &&
      row._count?.editorialCases === 0 && row._count?.synopsisEvidence === 0,
    createdAt: row.createdAt, updatedAt: row.updatedAt };
}

const selection = { id: true, subjectType: true, sourceName: true, sourceReference: true, sourcePayload: true, fingerprint: true, normalizedPayload: true,
  isQuarantined: true, creatorId: true, createdAt: true, updatedAt: true,
  _count: { select: { editorialCases: true, synopsisEvidence: true } } } as const;

/** Private manual ANIME candidate staging. No evidence verification, case approval or canonical writes. */
@Injectable()
export class AdminAnimeCandidatesService {
  constructor(private readonly prisma: PrismaService) {}

  private async requireAdmin(actorId: string) {
    if (!UUID.test(actorId)) throw new ForbiddenException('Administrator authentication required.');
    const actor = await this.prisma.user.findUnique({ where: { id: actorId }, select: { role: true } });
    if (actor?.role !== UserRole.ADMIN) throw new ForbiddenException('Administrator authentication required.');
  }

  async page(actorId: string, input?: AdminAnimeCandidatePageInput) {
    const page = input?.page ?? 1;
    const perPage = input?.perPage ?? 20;
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000 ||
      !Number.isSafeInteger(perPage) || perPage < 1 || perPage > 50 || (page - 1) * perPage > 100000) {
      throw new BadRequestException('Invalid pagination.');
    }
    if (input?.onlyMine !== undefined && typeof input.onlyMine !== 'boolean') {
      throw new BadRequestException('Invalid ownership filter.');
    }
    const search = input?.search?.trim() ?? '';
    if (search.length > 120) throw new BadRequestException('Search is too long.');
    await this.requireAdmin(actorId);
    const where: Prisma.CatalogCandidateWhereInput = {
      subjectType: 'ANIME', ...(input?.onlyMine !== false ? { creatorId: actorId } : {}),
      ...(search ? { OR: [
        { sourceName: { contains: search, mode: 'insensitive' } },
        { sourceReference: { contains: search, mode: 'insensitive' } },
      ] } : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.catalogCandidate.count({ where }),
      this.prisma.catalogCandidate.findMany({ where, select: selection,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * perPage, take: perPage }),
    ]);
    return { items: rows.map(row => present(row, actorId)), page, perPage, total,
      hasNextPage: page * perPage < total };
  }

  async create(actorId: string, input: CreateAdminAnimeCandidateInput) {
    const data = normalize(input);
    await this.requireAdmin(actorId);
    const row = await this.prisma.catalogCandidate.create({
      data: { subjectType: 'ANIME', sourceName: data.sourceName,
        sourceReference: data.sourceReference, creatorId: actorId, isQuarantined: true,
        sourcePayload: { entryType: 'MANUAL_ANIME_DRAFT', sourceReference: data.sourceReference },
        normalizedPayload: { synopsis: data.synopsis } }, select: selection,
    });
    return present(row, actorId);
  }

  async update(actorId: string, input: UpdateAdminAnimeCandidateInput) {
    if (!input || !UUID.test(input.candidateId) || typeof input.expectedUpdatedAt !== 'string' ||
      !ISO.test(input.expectedUpdatedAt) || !Number.isFinite(Date.parse(input.expectedUpdatedAt))) {
      throw new BadRequestException('A valid candidate and exact version token are required.');
    }
    const data = normalize(input);
    await this.requireAdmin(actorId);
    const expected = new Date(input.expectedUpdatedAt);
    return this.prisma.$transaction(async tx => {
      const current = await tx.catalogCandidate.findUnique({ where: { id: input.candidateId }, select: selection });
      if (!current || current.subjectType !== 'ANIME') {
        throw new ConflictException('Candidate unavailable.');
      }
      // Subject, ownership and quarantine must all be checked in the actual CAS predicate.
      if (!isManualDraft(current) || current.creatorId !== actorId || !current.isQuarantined ||
          current.updatedAt.getTime() !== expected.getTime() ||
          current._count.editorialCases !== 0 || current._count.synopsisEvidence !== 0) {
        throw new ConflictException('Candidate changed, linked to editorial review or inaccessible.');
      }
      const updated = await tx.catalogCandidate.updateMany({
        where: { id: current.id, subjectType: 'ANIME', creatorId: actorId, isQuarantined: true, fingerprint: null,
          updatedAt: expected, editorialCases: { none: {} }, synopsisEvidence: { none: {} } },
        data: { sourceName: data.sourceName, sourceReference: data.sourceReference,
          sourcePayload: { entryType: 'MANUAL_ANIME_DRAFT', sourceReference: data.sourceReference },
          normalizedPayload: { synopsis: data.synopsis },
          updatedAt: new Date(Math.max(Date.now(), expected.getTime() + 1)) },
      });
      if (updated.count !== 1) throw new ConflictException('Candidate changed; refresh before editing.');
      const result = await tx.catalogCandidate.findUnique({ where: { id: current.id }, select: selection });
      if (!result) throw new ConflictException('Candidate disappeared.');
      return present(result, actorId);
    }, { isolationLevel: 'Serializable' });
  }
}
