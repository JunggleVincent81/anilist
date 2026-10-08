import {
  Injectable,
} from '@nestjs/common';

import {
  ActivityVisibility,
} from '@prisma/client';

import {
  PrismaService,
} from '../database/prisma.service.js';

import type {
  UpdateActivitySettingsInput,
} from './dto/update-activity-settings.input.js';

import type {
  ActivitySettingsType,
} from './activities.graphql.js';

const DEFAULT_ACTIVITY_SETTINGS:
  ActivitySettingsType = {
    autoActivityEnabled:
      false,

    activityVisibility:
      ActivityVisibility
        .PUBLIC,
  };

@Injectable()
class ActivitySettingsService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  async findMine(
    userId: string,
  ): Promise<
    ActivitySettingsType
  > {
    const settings =
      await this.prisma
        .userSocialSettings
        .findUnique({
          where: {
            userId,
          },

          select: {
            autoActivityEnabled:
              true,

            activityVisibility:
              true,
          },
        });

    return (
      settings ??
      DEFAULT_ACTIVITY_SETTINGS
    );
  }

  async updateMine(
    userId: string,
    input:
      UpdateActivitySettingsInput,
  ): Promise<
    ActivitySettingsType
  > {
    if (
      input.autoActivityEnabled ===
        undefined &&
      input.activityVisibility ===
        undefined
    ) {
      return this.findMine(
        userId,
      );
    }

    return this.prisma
      .userSocialSettings
      .upsert({
        where: {
          userId,
        },

        create: {
          userId,

          autoActivityEnabled:
            input
              .autoActivityEnabled ??
            false,

          activityVisibility:
            input
              .activityVisibility ??
            ActivityVisibility
              .PUBLIC,
        },

        update: {
          ...(input
            .autoActivityEnabled !==
          undefined
            ? {
                autoActivityEnabled:
                  input
                    .autoActivityEnabled,
              }
            : {}),

          ...(input
            .activityVisibility !==
          undefined
            ? {
                activityVisibility:
                  input
                    .activityVisibility,
              }
            : {}),
        },

        select: {
          autoActivityEnabled:
            true,

          activityVisibility:
            true,
        },
      });
  }
}

export {
  ActivitySettingsService,
};
