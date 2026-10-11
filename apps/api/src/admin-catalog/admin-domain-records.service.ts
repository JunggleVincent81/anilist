import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';
import { AdminDomainKind, AdminPublicationFilter } from './admin-domain-records.graphql.js';
import type { AdminDomainPageInput, AdminDomainRecordPageType, AdminDomainRecordType } from './admin-domain-records.graphql.js';

/** P16-W03: canonical Manga/Music inventory; no insert/update/delete or release actions. */
@Injectable()
export class AdminDomainRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  async page(input: AdminDomainPageInput): Promise<AdminDomainRecordPageType> {
    if (!input || !Object.values(AdminDomainKind).includes(input.domain)) {
      throw new BadRequestException('Unknown canonical admin domain.');
    }
    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;
    if (!Number.isSafeInteger(page) || page < 1 || page > 10000 ||
        !Number.isSafeInteger(perPage) || perPage < 1 || perPage > 50 ||
        (page - 1) * perPage > 100000) {
      throw new BadRequestException('Invalid admin inventory pagination.');
    }
    if (input.search !== undefined && typeof input.search !== 'string') {
      throw new BadRequestException('Invalid search term.');
    }
    const search = input.search?.trim() ?? '';
    if (search.length > 120) throw new BadRequestException('Search term exceeds 120 characters.');
    const publication = input.publication ?? AdminPublicationFilter.ALL;
    if (!Object.values(AdminPublicationFilter).includes(publication)) {
      throw new BadRequestException('Invalid publication filter.');
    }
    const published = publication === AdminPublicationFilter.ALL ? {} :
      { isPublished: publication === AdminPublicationFilter.PUBLISHED };
    const skip = (page - 1) * perPage;
    const orderBy = [{ createdAt: 'desc' as const }, { id: 'desc' as const }];
    switch (input.domain) {
      case AdminDomainKind.MANGA_WORK: {
        const where: Prisma.MangaWorkWhereInput = { ...published, ...(search ? { OR: [{ title: { contains: search, mode: 'insensitive' } }, { slug: { contains: search, mode: 'insensitive' } }] } : {}) };
        return this.records(input.domain, page, perPage,
          () => this.prisma.mangaWork.count({ where }),
          () => this.prisma.mangaWork.findMany({ where, select: { id: true, title: true, slug: true, sourceName: true, sourceReference: true, isAdult: true, isPublished: true, createdAt: true }, skip, take: perPage, orderBy }),
          r => ({ id: r.id, title: r.title, subtitle: r.slug, sourceName: r.sourceName, sourceReference: r.sourceReference, relatedId: null, isPublished: r.isPublished, isAdult: r.isAdult, createdAt: r.createdAt }));
      }
      case AdminDomainKind.MANGA_VOLUME: {
        const where: Prisma.MangaVolumeWhereInput = { ...published, ...(search ? { OR: [{ title: { contains: search, mode: 'insensitive' } }, { volumeKey: { contains: search, mode: 'insensitive' } }] } : {}) };
        return this.records(input.domain, page, perPage,
          () => this.prisma.mangaVolume.count({ where }),
          () => this.prisma.mangaVolume.findMany({ where, select: { id: true, title: true, volumeKey: true, number: true, sourceReference: true, mangaWorkId: true, isPublished: true, createdAt: true }, skip, take: perPage, orderBy }),
          r => ({ id: r.id, title: r.title || `Volume ${r.number ?? r.volumeKey}`, subtitle: r.volumeKey, sourceName: null, sourceReference: r.sourceReference, relatedId: r.mangaWorkId, isPublished: r.isPublished, isAdult: null, createdAt: r.createdAt }));
      }
      case AdminDomainKind.MANGA_CHAPTER: {
        const where: Prisma.MangaChapterWhereInput = { ...published, ...(search ? { OR: [{ title: { contains: search, mode: 'insensitive' } }, { chapterKey: { contains: search, mode: 'insensitive' } }] } : {}) };
        return this.records(input.domain, page, perPage,
          () => this.prisma.mangaChapter.count({ where }),
          () => this.prisma.mangaChapter.findMany({ where, select: { id: true, title: true, chapterKey: true, number: true, chapterType: true, sourceReference: true, mangaWorkId: true, isPublished: true, createdAt: true }, skip, take: perPage, orderBy }),
          r => ({ id: r.id, title: r.title || `Chapter ${r.number?.toString() ?? r.chapterKey}`, subtitle: `${r.chapterType} · ${r.chapterKey}`, sourceName: null, sourceReference: r.sourceReference, relatedId: r.mangaWorkId, isPublished: r.isPublished, isAdult: null, createdAt: r.createdAt }));
      }
      case AdminDomainKind.MUSIC_TRACK: {
        const where: Prisma.AnimeMusicTrackWhereInput = { ...published, ...(search ? { OR: [{ title: { contains: search, mode: 'insensitive' } }, { slug: { contains: search, mode: 'insensitive' } }, { artistName: { contains: search, mode: 'insensitive' } }] } : {}) };
        return this.records(input.domain, page, perPage,
          () => this.prisma.animeMusicTrack.count({ where }),
          () => this.prisma.animeMusicTrack.findMany({ where, select: { id: true, title: true, slug: true, artistName: true, category: true, sourceName: true, sourceReference: true, animeId: true, isPublished: true, createdAt: true }, skip, take: perPage, orderBy }),
          r => ({ id: r.id, title: r.title, subtitle: `${r.artistName} · ${r.category} · ${r.slug}`, sourceName: r.sourceName, sourceReference: r.sourceReference, relatedId: r.animeId, isPublished: r.isPublished, isAdult: null, createdAt: r.createdAt }));
      }
      case AdminDomainKind.MUSIC_ARTIST: {
        const where: Prisma.MusicArtistWhereInput = { ...published, ...(search ? { OR: [{ displayName: { contains: search, mode: 'insensitive' } }, { artistKey: { contains: search, mode: 'insensitive' } }] } : {}) };
        return this.records(input.domain, page, perPage,
          () => this.prisma.musicArtist.count({ where }),
          () => this.prisma.musicArtist.findMany({ where, select: { id: true, displayName: true, artistKey: true, sourceName: true, sourceReference: true, isPublished: true, createdAt: true }, skip, take: perPage, orderBy }),
          r => ({ id: r.id, title: r.displayName, subtitle: r.artistKey, sourceName: r.sourceName, sourceReference: r.sourceReference, relatedId: null, isPublished: r.isPublished, isAdult: null, createdAt: r.createdAt }));
      }
      case AdminDomainKind.MUSIC_RECORDING: {
        const where: Prisma.MusicRecordingWhereInput = { ...published, ...(search ? { OR: [{ title: { contains: search, mode: 'insensitive' } }, { recordingKey: { contains: search, mode: 'insensitive' } }, { versionLabel: { contains: search, mode: 'insensitive' } }] } : {}) };
        return this.records(input.domain, page, perPage,
          () => this.prisma.musicRecording.count({ where }),
          () => this.prisma.musicRecording.findMany({ where, select: { id: true, title: true, recordingKey: true, versionLabel: true, sourceName: true, sourceReference: true, animeMusicTrackId: true, isPublished: true, createdAt: true }, skip, take: perPage, orderBy }),
          r => ({ id: r.id, title: r.title, subtitle: r.versionLabel || r.recordingKey, sourceName: r.sourceName, sourceReference: r.sourceReference, relatedId: r.animeMusicTrackId, isPublished: r.isPublished, isAdult: null, createdAt: r.createdAt }));
      }
      case AdminDomainKind.MUSIC_RELEASE: {
        const where: Prisma.MusicReleaseWhereInput = { ...published, ...(search ? { OR: [{ title: { contains: search, mode: 'insensitive' } }, { releaseKey: { contains: search, mode: 'insensitive' } }] } : {}) };
        return this.records(input.domain, page, perPage,
          () => this.prisma.musicRelease.count({ where }),
          () => this.prisma.musicRelease.findMany({ where, select: { id: true, title: true, releaseKey: true, releaseType: true, sourceName: true, sourceReference: true, isPublished: true, createdAt: true }, skip, take: perPage, orderBy }),
          r => ({ id: r.id, title: r.title, subtitle: `${r.releaseType} · ${r.releaseKey}`, sourceName: r.sourceName, sourceReference: r.sourceReference, relatedId: null, isPublished: r.isPublished, isAdult: null, createdAt: r.createdAt }));
      }
      case AdminDomainKind.MUSIC_RELEASE_TRACK: {
        const where: Prisma.MusicReleaseTrackWhereInput = { ...published, ...(search ? { OR: [{ displayTitle: { contains: search, mode: 'insensitive' } }] } : {}) };
        return this.records(input.domain, page, perPage,
          () => this.prisma.musicReleaseTrack.count({ where }),
          () => this.prisma.musicReleaseTrack.findMany({ where, select: { id: true, displayTitle: true, discNumber: true, trackNumber: true, releaseId: true, recordingId: true, isPublished: true, createdAt: true }, skip, take: perPage, orderBy }),
          r => ({ id: r.id, title: r.displayTitle || `Disc ${r.discNumber}, track ${r.trackNumber}`, subtitle: `Disc ${r.discNumber} · position ${r.trackNumber}`, sourceName: null, sourceReference: null, relatedId: r.releaseId, isPublished: r.isPublished, isAdult: null, createdAt: r.createdAt }));
      }
      case AdminDomainKind.MUSIC_CREDIT: {
        const where: Prisma.MusicCreditWhereInput = { ...published, ...(search ? { OR: [{ role: { contains: search, mode: 'insensitive' } }, { creditedAs: { contains: search, mode: 'insensitive' } }] } : {}) };
        return this.records(input.domain, page, perPage,
          () => this.prisma.musicCredit.count({ where }),
          () => this.prisma.musicCredit.findMany({ where, select: { id: true, role: true, kind: true, creditedAs: true, artistId: true, sourceName: true, sourceReference: true, isPublished: true, createdAt: true }, skip, take: perPage, orderBy }),
          r => ({ id: r.id, title: r.creditedAs || r.role, subtitle: `${r.kind} · ${r.role}`, sourceName: r.sourceName, sourceReference: r.sourceReference, relatedId: r.artistId, isPublished: r.isPublished, isAdult: null, createdAt: r.createdAt }));
      }
      default:
        throw new BadRequestException('Unsupported admin domain.');
    }
  }

  private async records<T>(
    domain: AdminDomainKind, page: number, perPage: number,
    counter: () => Promise<number>, finder: () => Promise<T[]>,
    present: (row: T) => AdminDomainRecordType,
  ): Promise<AdminDomainRecordPageType> {
    try {
      const [total, rows] = await Promise.all([counter(), finder()]);
      return { domain, available: true, items: rows.map(present), page, perPage,
        total, hasNextPage: page * perPage < total };
    } catch (error: unknown) {
      // P2021: table missing; P2022: column missing. A migration is pending.
      // Other failures (auth, outage, query bug) propagate instead of masquerading as emptiness.
      const code = error && typeof error === 'object' && 'code' in error ? error.code : null;
      if (code === 'P2021' || code === 'P2022') {
        return { domain, available: false, items: [], page, perPage, total: null, hasNextPage: false };
      }
      throw error;
    }
  }
}
