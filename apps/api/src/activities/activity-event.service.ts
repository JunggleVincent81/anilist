import {
  Injectable,
  Logger,
} from '@nestjs/common';

import {
  ActivityType,
  AnimeListStatus,
} from '@prisma/client';

import {
  PrismaService,
} from '../database/prisma.service.js';

type TrackingActivityDelta = {
  userId: string;
  animeId: string;

  previousStatus:
    AnimeListStatus | null;

  nextStatus:
    AnimeListStatus;

  previousProgressEpisodes:
    number | null;

  nextProgressEpisodes:
    number;
};

@Injectable()
class ActivityEventService {
  private readonly logger =
    new Logger(
      ActivityEventService.name,
    );

  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  async recordTrackingUpdateBestEffort(
    input:
      TrackingActivityDelta,
  ): Promise<void> {
    try {
      await this.recordTrackingUpdate(
        input,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      this.logger.warn(
        `Activity generation failed: ${message}`,
      );
    }
  }

  private async recordTrackingUpdate(
    input:
      TrackingActivityDelta,
  ): Promise<void> {
    const settings =
      await this.prisma
        .userSocialSettings
        .findUnique({
          where: {
            userId:
              input.userId,
          },

          select: {
            autoActivityEnabled:
              true,
          },
        });

    if (
      !settings
        ?.autoActivityEnabled
    ) {
      return;
    }

    const statusChanged =
      input.previousStatus !==
      input.nextStatus;

    const progressChanged =
      input
        .previousProgressEpisodes !==
      input
        .nextProgressEpisodes;

    if (
      !statusChanged &&
      !progressChanged
    ) {
      return;
    }

    const type =
      statusChanged
        ? ActivityType
            .ANIME_STATUS
        : ActivityType
            .ANIME_PROGRESS;

    await this.prisma
      .activity
      .create({
        data: {
          userId:
            input.userId,

          animeId:
            input.animeId,

          type,

          animeStatus:
            input.nextStatus,

          progressEpisodes:
            input
              .nextProgressEpisodes,
        },

        select: {
          id: true,
        },
      });
  }
}

export {
  ActivityEventService,
};

export type {
  TrackingActivityDelta,
};
