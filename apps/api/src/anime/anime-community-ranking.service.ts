import { Injectable } from '@nestjs/common';
import { AnimeCatalogStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service.js';
import { communityWeightedScore } from './community-weighted-score.js';

export const MIN_SCORED_REVIEWS = 3;
export const MAX_RANKED_ANIME = 6;

const publicScoredReviewFilter = {
  score: { not: null },
  anime: { is: { catalogStatus: AnimeCatalogStatus.INCLUDED, isAdult: false } },
} as const;

@Injectable()
export class AnimeCommunityRankingService {
  constructor(private readonly prisma: PrismaService) {}

  async topRated() {
    // Both the prior and title scores come exclusively from our own eligible scored reviews.
    const community = await this.prisma.animeReview.aggregate({
      where: publicScoredReviewFilter,
      _avg: { score: true },
      _count: { score: true },
    });
    const communityMean = community._avg.score === null ? NaN : Number(community._avg.score);
    if (!Number.isFinite(communityMean) || community._count.score === 0) return [];

    // All eligible title groups must be scored before limiting the results.
    const groups = await this.prisma.animeReview.groupBy({
      by: ['animeId'],
      where: publicScoredReviewFilter,
      _avg: { score: true },
      _count: { score: true },
      having: { score: { _count: { gte: MIN_SCORED_REVIEWS } } },
    });

    const leaders = groups.flatMap((row) => {
      const mean = row._avg.score === null ? NaN : Number(row._avg.score);
      const count = row._count.score;
      if (!Number.isFinite(mean) || count < MIN_SCORED_REVIEWS) return [];
      return [{ animeId: row.animeId, averageScore: mean, scoredReviewCount: count,
        weightedScore: communityWeightedScore(mean, count, communityMean) }];
    }).sort((a, b) => b.weightedScore - a.weightedScore ||
      b.scoredReviewCount - a.scoredReviewCount || a.animeId.localeCompare(b.animeId))
      .slice(0, MAX_RANKED_ANIME);

    if (!leaders.length) return [];
    const titles = await this.prisma.anime.findMany({
      where: { id: { in: leaders.map((row) => row.animeId) }, catalogStatus: AnimeCatalogStatus.INCLUDED, isAdult: false },
      select: { id: true, slug: true, title: true },
    });
    const titlesById = new Map(titles.map((title) => [title.id, title]));
    return leaders.flatMap((row) => {
      const title = titlesById.get(row.animeId);
      if (!title) return [];
      return [{ slug: title.slug, title: title.title,
        averageScore: Math.round(row.averageScore * 100) / 100,
        weightedScore: Math.round(row.weightedScore * 100) / 100,
        scoredReviewCount: row.scoredReviewCount }];
    });
  }
}
