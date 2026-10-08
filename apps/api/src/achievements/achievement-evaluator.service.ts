import {
  Injectable,
} from '@nestjs/common';

import {
  AchievementMetric,
  AnimeCatalogStatus,
  AnimeListStatus,
} from '@prisma/client';

import {
  PrismaService,
} from '../database/prisma.service.js';

type AchievementMetricsSnapshot = {
  trackedAnime: number;
  completedAnime: number;
  episodesLogged: number;
  scoredAnime: number;
  rewatches: number;
  favoriteAnimeCount: number;

  genres:
    Map<string, number>;
};

type AchievementEvaluationResult = {
  evaluatedAchievements:
    number;

  newlyUnlocked:
    number;

  totalUnlocked:
    number;
};

@Injectable()
export class AchievementEvaluatorService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  async evaluateUser(
    userId: string,
  ): Promise<
    AchievementEvaluationResult
  > {
    const [
      achievements,
      metrics,
      existingUnlocks,
    ] =
      await Promise.all([
        this.prisma
          .achievement
          .findMany({
            where: {
              isActive: true,
            },

            select: {
              id: true,
              metric: true,
              threshold: true,
              targetKey: true,
            },

            orderBy: [
              {
                sortOrder:
                  'asc',
              },
              {
                code:
                  'asc',
              },
            ],
          }),

        this.getUserMetrics(
          userId,
        ),

        this.prisma
          .userAchievement
          .findMany({
            where: {
              userId,
            },

            select: {
              achievementId:
                true,
            },
          }),
      ]);

    const unlockedIds =
      new Set(
        existingUnlocks.map(
          (unlock) =>
            unlock.achievementId,
        ),
      );

    const achievementIdsToUnlock:
      string[] = [];

    for (
      const achievement
      of achievements
    ) {
      if (
        unlockedIds.has(
          achievement.id,
        )
      ) {
        continue;
      }

      const value =
        this.getMetricValue(
          achievement.metric,
          achievement.targetKey,
          metrics,
        );

      if (
        value >=
        achievement.threshold
      ) {
        achievementIdsToUnlock
          .push(
            achievement.id,
          );
      }
    }

    let newlyUnlocked = 0;

    if (
      achievementIdsToUnlock
        .length > 0
    ) {
      const result =
        await this.prisma
          .userAchievement
          .createMany({
            data:
              achievementIdsToUnlock
                .map(
                  (
                    achievementId,
                  ) => ({
                    userId,
                    achievementId,
                  }),
                ),

            skipDuplicates:
              true,
          });

      newlyUnlocked =
        result.count;
    }

    const totalUnlocked =
      await this.prisma
        .userAchievement
        .count({
          where: {
            userId,
          },
        });

    return {
      evaluatedAchievements:
        achievements.length,

      newlyUnlocked,

      totalUnlocked,
    };
  }

  async getUserMetrics(
    userId: string,
  ): Promise<
    AchievementMetricsSnapshot
  > {
    const [
      entries,
      favoriteAnimeCount,
    ] =
      await Promise.all([
        this.prisma
          .animeListEntry
          .findMany({
            where: {
              userId,

              anime: {
                catalogStatus:
                  AnimeCatalogStatus
                    .INCLUDED,
              },
            },

            select: {
              status: true,

              progressEpisodes:
                true,

              score: true,

              rewatchCount:
                true,

              anime: {
                select: {
                  genres: {
                    select: {
                      genre: {
                        select: {
                          slug: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          }),

        this.prisma
          .animeFavorite
          .count({
            where: {
              userId,

              anime: {
                catalogStatus:
                  AnimeCatalogStatus
                    .INCLUDED,
              },
            },
          }),
      ]);

    let completedAnime = 0;
    let episodesLogged = 0;
    let scoredAnime = 0;
    let rewatches = 0;

    const genres =
      new Map<
        string,
        number
      >();

    for (
      const entry of entries
    ) {
      if (
        entry.status ===
        AnimeListStatus
          .COMPLETED
      ) {
        completedAnime += 1;
      }

      episodesLogged +=
        entry.progressEpisodes;

      rewatches +=
        entry.rewatchCount;

      if (
        entry.score !== null
      ) {
        scoredAnime += 1;
      }

      for (
        const link of
          entry.anime.genres
      ) {
        const slug =
          link.genre.slug;

        genres.set(
          slug,
          (
            genres.get(
              slug,
            ) ??
            0
          ) + 1,
        );
      }
    }

    return {
      trackedAnime:
        entries.length,

      completedAnime,

      episodesLogged,

      scoredAnime,

      rewatches,

      favoriteAnimeCount,

      genres,
    };
  }

  getMetricValue(
    metric:
      AchievementMetric,

    targetKey:
      string | null,

    metrics:
      AchievementMetricsSnapshot,
  ): number {
    switch (metric) {
      case AchievementMetric
        .TRACKED_ANIME:
        return metrics
          .trackedAnime;

      case AchievementMetric
        .COMPLETED_ANIME:
        return metrics
          .completedAnime;

      case AchievementMetric
        .EPISODES_LOGGED:
        return metrics
          .episodesLogged;

      case AchievementMetric
        .SCORED_ANIME:
        return metrics
          .scoredAnime;

      case AchievementMetric
        .REWATCHES:
        return metrics
          .rewatches;

      case AchievementMetric
        .FAVORITE_ANIME:
        return metrics
          .favoriteAnimeCount;

      case AchievementMetric
        .GENRE_ANIME:
        if (!targetKey) {
          return 0;
        }

        return (
          metrics.genres
            .get(
              targetKey,
            ) ??
          0
        );
    }
  }
}

export type {
  AchievementEvaluationResult,
  AchievementMetricsSnapshot,
};
