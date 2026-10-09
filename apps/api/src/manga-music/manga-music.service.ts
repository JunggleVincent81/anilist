import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class MangaMusicService {
  constructor(private readonly prisma: PrismaService) {}

  // No demo data, unreviewed titles or unknown-adult manga may enter public queries.
  async manga() {
    return this.prisma.mangaWork.findMany({
      where: { isPublished: true, isAdult: false },
      orderBy: [{ title: 'asc' }, { id: 'asc' }], take: 20,
      select: { id: true, slug: true, title: true, synopsis: true, sourceName: true, sourceReference: true },
    });
  }

  async music() {
    const rows = await this.prisma.animeMusicTrack.findMany({
      where: {
        isPublished: true,
        OR: [
          { animeId: null },
          { anime: { is: { isAdult: false, catalogStatus: 'INCLUDED' } } },
        ],
      },
      orderBy: [{ title: 'asc' }, { id: 'asc' }], take: 20,
      select: { id: true, slug: true, title: true, artistName: true, category: true,
        sourceName: true, sourceReference: true, anime: { select: { slug: true } } },
    });
    return rows.map(({ anime, category, ...row }) => ({ ...row, category, animeSlug: anime?.slug ?? null }));
  }
}
