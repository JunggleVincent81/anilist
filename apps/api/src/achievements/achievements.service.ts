import {
  Injectable,
} from '@nestjs/common';

import {
  PrismaService,
} from '../database/prisma.service.js';

import {
  AchievementEvaluatorService,
} from './achievement-evaluator.service.js';

import {
  AchievementValidationError,
} from './achievements.errors.js';

import type {
  AchievementProfileType,
} from './achievements.graphql.js';

const USERNAME_PATTERN =
  /^[a-z0-9_]{3,24}$/;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class AchievementsService {
  constructor(
    private readonly prisma:
      PrismaService,

    private readonly evaluator:
      AchievementEvaluatorService,
  ) {}

  async findPublic(
    username: string,
  ): Promise<
    AchievementProfileType | null
  > {
    const normalized =
      username
        .trim()
        .toLowerCase();

    if (
      !USERNAME_PATTERN.test(
        normalized,
      )
    ) {
      return null;
    }

    const user =
      await this.prisma
        .user
        .findUnique({
          where: {
            username:
              normalized,
          },

          select: {
            id: true,
          },
        });

    if (!user) {
      return null;
    }

    return this.findByUserId(
      user.id,
    );
  }

  async findByUserId(
    userId: string,
  ): Promise<
    AchievementProfileType | null
  > {
    const user =
      await this.prisma
        .user
        .findUnique({
          where: {
            id: userId,
          },

          select: {
            id: true,
            username: true,

            equippedTitleAchievement: {
              select: {
                id: true,
                code: true,
                titleReward: true,
                isActive: true,
              },
            },
          },
        });

    if (!user) {
      return null;
    }

    const [
      achievements,
      unlocks,
      metrics,
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
              code: true,
              name: true,
              description: true,

              category: true,
              metric: true,

              threshold: true,

              targetKey: true,

              iconKey: true,

              titleReward: true,

              sortOrder: true,
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

        this.prisma
          .userAchievement
          .findMany({
            where: {
              userId:
                user.id,
            },

            select: {
              achievementId:
                true,

              unlockedAt:
                true,

              showcasePosition:
                true,
            },
          }),

        this.evaluator
          .getUserMetrics(
            user.id,
          ),
      ]);

    const unlockMap =
      new Map(
        unlocks.map(
          (unlock) => [
            unlock.achievementId,
            unlock,
          ],
        ),
      );

    const items =
      achievements.map(
        (
          achievement,
        ) => {
          const unlock =
            unlockMap.get(
              achievement.id,
            );

          const progress =
            this.evaluator
              .getMetricValue(
                achievement.metric,
                achievement.targetKey,
                metrics,
              );

          const progressPercent =
            achievement.threshold >
            0
              ? Math.min(
                  100,
                  Math.round(
                    (
                      progress /
                      achievement
                        .threshold
                    ) *
                      10000,
                  ) / 100,
                )
              : 0;

          return {
            id:
              achievement.id,

            code:
              achievement.code,

            name:
              achievement.name,

            description:
              achievement
                .description,

            category:
              achievement
                .category,

            metric:
              achievement.metric,

            threshold:
              achievement
                .threshold,

            targetKey:
              achievement
                .targetKey,

            iconKey:
              achievement.iconKey,

            titleReward:
              achievement
                .titleReward,

            progress,

            progressPercent,

            unlocked:
              Boolean(unlock),

            unlockedAt:
              unlock
                ?.unlockedAt ??
              null,

            showcasePosition:
              unlock
                ?.showcasePosition ??
              null,

            canEquipTitle:
              Boolean(
                unlock &&
                  achievement
                    .titleReward,
              ),
          };
        },
      );

    const showcase =
      items
        .filter(
          (item) =>
            item.unlocked &&
            item
              .showcasePosition !==
              null,
        )
        .sort(
          (
            first,
            second,
          ) =>
            (
              first
                .showcasePosition ??
              99
            ) -
            (
              second
                .showcasePosition ??
              99
            ),
        );

    const equipped =
      user
        .equippedTitleAchievement;

    const equippedTitle =
      equipped &&
      equipped.isActive &&
      equipped.titleReward
        ? {
            achievementId:
              equipped.id,

            code:
              equipped.code,

            title:
              equipped
                .titleReward,
          }
        : null;

    return {
      username:
        user.username,

      total:
        items.length,

      unlockedCount:
        items.filter(
          (item) =>
            item.unlocked,
        ).length,

      equippedTitle,

      showcase,

      items,
    };
  }

  async setShowcase(
    userId: string,
    achievementId: string,
    position:
      number | null,
  ): Promise<
    AchievementProfileType
  > {
    this.assertAchievementId(
      achievementId,
    );

    if (
      position !== null &&
      (
        !Number.isInteger(
          position,
        ) ||
        position < 1 ||
        position > 3
      )
    ) {
      throw new AchievementValidationError(
        'Showcase position must be 1, 2, 3, or null.',
      );
    }

    const unlock =
      await this.prisma
        .userAchievement
        .findUnique({
          where: {
            userId_achievementId: {
              userId,
              achievementId,
            },
          },

          select: {
            id: true,
          },
        });

    if (!unlock) {
      throw new AchievementValidationError(
        'Only unlocked achievements can be showcased.',
      );
    }

    await this.prisma
      .$transaction(
        async (
          transaction,
        ) => {
          if (
            position !== null
          ) {
            await transaction
              .userAchievement
              .updateMany({
                where: {
                  userId,
                  showcasePosition:
                    position,
                },

                data: {
                  showcasePosition:
                    null,
                },
              });
          }

          await transaction
            .userAchievement
            .update({
              where: {
                id:
                  unlock.id,
              },

              data: {
                showcasePosition:
                  position,
              },
            });
        },
      );

    const profile =
      await this.findByUserId(
        userId,
      );

    if (!profile) {
      throw new AchievementValidationError(
        'User does not exist.',
      );
    }

    return profile;
  }

  async equipTitle(
    userId: string,
    achievementId:
      string | null,
  ): Promise<
    AchievementProfileType
  > {
    if (
      achievementId === null
    ) {
      await this.prisma
        .user
        .update({
          where: {
            id: userId,
          },

          data: {
            equippedTitleAchievementId:
              null,
          },
        });

      const profile =
        await this
          .findByUserId(
            userId,
          );

      if (!profile) {
        throw new AchievementValidationError(
          'User does not exist.',
        );
      }

      return profile;
    }

    this.assertAchievementId(
      achievementId,
    );

    const unlock =
      await this.prisma
        .userAchievement
        .findUnique({
          where: {
            userId_achievementId: {
              userId,
              achievementId,
            },
          },

          select: {
            achievement: {
              select: {
                id: true,
                isActive: true,
                titleReward: true,
              },
            },
          },
        });

    if (!unlock) {
      throw new AchievementValidationError(
        'The achievement must be unlocked before its title can be equipped.',
      );
    }

    if (
      !unlock
        .achievement
        .isActive
    ) {
      throw new AchievementValidationError(
        'This achievement is not active.',
      );
    }

    if (
      !unlock
        .achievement
        .titleReward
    ) {
      throw new AchievementValidationError(
        'This achievement does not provide a title.',
      );
    }

    await this.prisma
      .user
      .update({
        where: {
          id: userId,
        },

        data: {
          equippedTitleAchievementId:
            unlock
              .achievement
              .id,
        },
      });

    const profile =
      await this.findByUserId(
        userId,
      );

    if (!profile) {
      throw new AchievementValidationError(
        'User does not exist.',
      );
    }

    return profile;
  }

  private assertAchievementId(
    achievementId: string,
  ): void {
    if (
      !UUID_PATTERN.test(
        achievementId,
      )
    ) {
      throw new AchievementValidationError(
        'Invalid achievement id.',
      );
    }
  }
}
