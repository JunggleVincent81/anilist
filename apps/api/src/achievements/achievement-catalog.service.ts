import {
  Injectable,
  type OnModuleInit,
} from '@nestjs/common';

import {
  PrismaService,
} from '../database/prisma.service.js';

import {
  ACHIEVEMENT_CATALOG,
} from './achievement.catalog.js';

@Injectable()
export class AchievementCatalogService
implements OnModuleInit {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  async onModuleInit():
    Promise<void> {
    await this.syncCatalog();
  }

  async syncCatalog():
    Promise<void> {
    const codes =
      ACHIEVEMENT_CATALOG.map(
        (achievement) =>
          achievement.code,
      );

    await this.prisma.$transaction(
      async (transaction) => {
        await transaction
          .achievement
          .updateMany({
            where: {
              code: {
                notIn:
                  codes,
              },
            },

            data: {
              isActive:
                false,
            },
          });

        for (
          const achievement
          of ACHIEVEMENT_CATALOG
        ) {
          const data = {
            name:
              achievement.name,

            description:
              achievement.description,

            category:
              achievement.category,

            metric:
              achievement.metric,

            threshold:
              achievement.threshold,

            targetKey:
              achievement.targetKey,

            iconKey:
              achievement.iconKey,

            titleReward:
              achievement
                .titleReward,

            sortOrder:
              achievement.sortOrder,

            isActive:
              true,
          };

          await transaction
            .achievement
            .upsert({
              where: {
                code:
                  achievement.code,
              },

              create: {
                code:
                  achievement.code,

                ...data,
              },

              update:
                data,
            });
        }
      },
    );
  }
}
