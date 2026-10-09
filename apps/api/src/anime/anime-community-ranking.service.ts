import { Injectable } from '@nestjs/common';
import { AnimeCatalogStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';

export const MIN_SCORED_REVIEWS = 3;
export const MAX_RANKED_ANIME = 6;

@Injectable()
export class AnimeCommunityRankingService {
  constructor(private readonly prisma: PrismaService) {}

  async topRated() {
    // Scores belong to AniList community members, NOT third-party catalog providers.
    const groups = await this.prisma.animeReview.groupBy({
      by: ['animeId'],
      where: {
        score: { not: null },
        anime: { is: { catalogStatus: AnimeCatalogStatus.INCLUDED, isAdult: false } },
      },
      _avg: { score: true },
      _count: { score: true },
      having: { score: { _count: { gte: MIN_SCORED_REVIEWS } } },
      orderBy: [
        { _avg: { score: 'desc' } },
        { _count: { score: 'desc' } },
        { animeId: 'asc' },
      ],
      take: MAX_RANKED_ANIME,
    });
    if (!groups.length) return [];
    // Recheck public eligibility when resolving the winning titles.
    const titles = await this.prisma.anime.findMany({
      where: { id: { in: groups.map((row) => row.animeId) }, catalogStatus: AnimeCatalogStatus.INCLUDED, isAdult: false },
      select: { id: true, slug: true, title: true },
    });
    const titlesById = new Map(titles.map((title) => [title.id, title]));
    return groups.flatMap((row) => {
      const title = titlesById.get(row.animeId);
      const averageScore = row._avg.score === null ? NaN : Number(row._avg.score);
      if (!title || !Number.isFinite(averageScore) || row._count.score < MIN_SCORED_REVIEWS) return [];
      return [{ slug: title.slug, title: title.title, averageScore: Math.round(averageScore * 100) / 100, scoredReviewCount: row._count.score }];
    });
  }
}
