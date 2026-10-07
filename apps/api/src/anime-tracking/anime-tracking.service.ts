import {
  Injectable,
} from '@nestjs/common';

import {
  AnimeCatalogStatus,
  AnimeListStatus,
  Prisma,
} from '@prisma/client';

import {
  PrismaService,
} from '../database/prisma.service.js';

import type {
  AnimeListEntryType,
  AnimeListPageType,
} from './anime-tracking.graphql.js';

import {
  AnimeTrackingValidationError,
} from './anime-tracking.errors.js';

import type {
  AnimeListQueryInput,
} from './dto/anime-list-query.input.js';

import type {
  UpsertAnimeListEntryInput,
} from './dto/upsert-anime-list-entry.input.js';

const animeListEntrySelect = {
  id: true,

  status: true,

  progressEpisodes: true,
  score: true,
  rewatchCount: true,

  startedAt: true,
  completedAt: true,

  createdAt: true,
  updatedAt: true,

  anime: {
    select: {
      id: true,
      slug: true,
      title: true,

      format: true,
      status: true,

      episodes: true,

      season: true,
      seasonYear: true,

      coverImageUrl: true,
    },
  },
} satisfies Prisma.AnimeListEntrySelect;

type AnimeListEntryRecord =
  Prisma.AnimeListEntryGetPayload<{
    select:
      typeof animeListEntrySelect;
  }>;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class AnimeTrackingService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  async findMine(
    userId: string,
    animeId: string,
  ): Promise<
    AnimeListEntryType | null
  > {
    if (
      !UUID_PATTERN.test(
        animeId,
      )
    ) {
      return null;
    }

    const entry =
      await this.prisma
        .animeListEntry
        .findFirst({
          where: {
            userId,
            animeId,

            anime: {
              catalogStatus:
                AnimeCatalogStatus
                  .INCLUDED,
            },
          },

          select:
            animeListEntrySelect,
        });

    return entry
      ? this.mapEntry(entry)
      : null;
  }

  async findPublicList(
    input: AnimeListQueryInput,
  ): Promise<
    AnimeListPageType | null
  > {
    const username =
      input.username
        .trim()
        .toLowerCase();

    if (
      !/^[a-z0-9_]{3,24}$/.test(
        username,
      )
    ) {
      return null;
    }

    const user =
      await this.prisma
        .user
        .findUnique({
          where: {
            username,
          },

          select: {
            id: true,
            username: true,
          },
        });

    if (!user) {
      return null;
    }

    const page =
      input.page ?? 1;

    const perPage =
      input.perPage ?? 50;

    const where:
      Prisma.AnimeListEntryWhereInput =
      {
        userId:
          user.id,

        anime: {
          catalogStatus:
            AnimeCatalogStatus
              .INCLUDED,
        },

        ...(input.status
          ? {
              status:
                input.status,
            }
          : {}),
      };

    const [
      total,
      entries,
    ] =
      await Promise.all([
        this.prisma
          .animeListEntry
          .count({
            where,
          }),

        this.prisma
          .animeListEntry
          .findMany({
            where,

            select:
              animeListEntrySelect,

            orderBy: [
              {
                updatedAt:
                  'desc',
              },
              {
                id:
                  'asc',
              },
            ],

            skip:
              (page - 1) *
              perPage,

            take:
              perPage,
          }),
      ]);

    const pageCount =
      total === 0
        ? 0
        : Math.ceil(
            total /
              perPage,
          );

    return {
      username:
        user.username,

      entries:
        entries.map(
          (entry) =>
            this.mapEntry(
              entry,
            ),
        ),

      pageInfo: {
        page,
        perPage,
        total,
        pageCount,

        hasNextPage:
          page <
          pageCount,

        hasPreviousPage:
          total > 0 &&
          page > 1,
      },
    };
  }

  async upsert(
    userId: string,
    input:
      UpsertAnimeListEntryInput,
  ): Promise<AnimeListEntryType> {
    const anime =
      await this.prisma
        .anime
        .findFirst({
          where: {
            id:
              input.animeId,

            catalogStatus:
              AnimeCatalogStatus
                .INCLUDED,
          },

          select: {
            id: true,
            episodes: true,
          },
        });

    if (!anime) {
      throw new AnimeTrackingValidationError(
        'Anime is not available for tracking.',
      );
    }

    const existing =
      await this.prisma
        .animeListEntry
        .findUnique({
          where: {
            userId_animeId: {
              userId,
              animeId:
                anime.id,
            },
          },

          select: {
            status: true,

            progressEpisodes:
              true,

            score: true,

            rewatchCount:
              true,

            startedAt: true,
            completedAt:
              true,
          },
        });

    const nextStatus =
      input.status ??
      existing?.status ??
      AnimeListStatus
        .PLANNING;

    let progressEpisodes =
      input.progressEpisodes ??
      existing
        ?.progressEpisodes ??
      0;

    if (
      nextStatus ===
        AnimeListStatus
          .REWATCHING &&
      existing &&
      existing.status !==
        AnimeListStatus
          .REWATCHING &&
      input.progressEpisodes ===
        undefined
    ) {
      progressEpisodes = 0;
    }

    if (
      anime.episodes !==
        null &&
      progressEpisodes >
        anime.episodes
    ) {
      throw new AnimeTrackingValidationError(
        `Episode progress cannot exceed ${anime.episodes}.`,
      );
    }

    if (
      nextStatus ===
        AnimeListStatus
          .COMPLETED &&
      anime.episodes !==
        null
    ) {
      progressEpisodes =
        anime.episodes;
    }

    const score =
      input.score ===
      undefined
        ? existing?.score ??
          null
        : input.score;

    if (
      typeof score ===
      'number'
    ) {
      const validStep =
        Number.isInteger(
          score * 2,
        );

      if (
        !Number.isFinite(
          score,
        ) ||
        score < 1 ||
        score > 10 ||
        !validStep
      ) {
        throw new AnimeTrackingValidationError(
          'Score must be between 1.0 and 10.0 in 0.5 increments.',
        );
      }
    }

    const now =
      new Date();

    let startedAt =
      existing?.startedAt ??
      null;

    if (
      !startedAt &&
      nextStatus !==
        AnimeListStatus
          .PLANNING
    ) {
      startedAt = now;
    }

    let completedAt =
      existing
        ?.completedAt ??
      null;

    let rewatchCount =
      existing
        ?.rewatchCount ??
      0;

    if (
      nextStatus ===
        AnimeListStatus
          .COMPLETED &&
      existing?.status !==
        AnimeListStatus
          .COMPLETED
    ) {
      completedAt = now;

      if (
        existing?.status ===
        AnimeListStatus
          .REWATCHING
      ) {
        rewatchCount += 1;
      }
    }

    const entry =
      await this.prisma
        .animeListEntry
        .upsert({
          where: {
            userId_animeId: {
              userId,
              animeId:
                anime.id,
            },
          },

          create: {
            userId,
            animeId:
              anime.id,

            status:
              nextStatus,

            progressEpisodes,
            score,

            rewatchCount,

            startedAt,
            completedAt,
          },

          update: {
            status:
              nextStatus,

            progressEpisodes,
            score,

            rewatchCount,

            startedAt,
            completedAt,
          },

          select:
            animeListEntrySelect,
        });

    return this.mapEntry(
      entry,
    );
  }

  async remove(
    userId: string,
    animeId: string,
  ): Promise<boolean> {
    if (
      !UUID_PATTERN.test(
        animeId,
      )
    ) {
      return false;
    }

    const result =
      await this.prisma
        .animeListEntry
        .deleteMany({
          where: {
            userId,
            animeId,
          },
        });

    return result.count > 0;
  }

  private mapEntry(
    entry:
      AnimeListEntryRecord,
  ): AnimeListEntryType {
    return {
      id:
        entry.id,

      status:
        entry.status,

      progressEpisodes:
        entry.progressEpisodes,

      score:
        entry.score
          ? entry.score
              .toNumber()
          : null,

      rewatchCount:
        entry.rewatchCount,

      startedAt:
        entry.startedAt,

      completedAt:
        entry.completedAt,

      anime:
        entry.anime,

      createdAt:
        entry.createdAt,

      updatedAt:
        entry.updatedAt,
    };
  }
}
