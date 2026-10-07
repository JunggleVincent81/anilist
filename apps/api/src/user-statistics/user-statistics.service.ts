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
  UserStatisticsType,
} from './user-statistics.graphql.js';

const statisticsEntrySelect = {
  status: true,
  progressEpisodes: true,
  score: true,
  rewatchCount: true,

  anime: {
    select: {
      genres: {
        select: {
          genre: {
            select: {
              id: true,
              slug: true,
              name: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.AnimeListEntrySelect;

type StatisticsEntry =
  Prisma.AnimeListEntryGetPayload<{
    select:
      typeof statisticsEntrySelect;
  }>;

const USERNAME_PATTERN =
  /^[a-z0-9_]{3,24}$/;

@Injectable()
export class UserStatisticsService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  async findPublic(
    username: string,
  ): Promise<
    UserStatisticsType | null
  > {
    const normalizedUsername =
      username
        .trim()
        .toLowerCase();

    if (
      !USERNAME_PATTERN.test(
        normalizedUsername,
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
              normalizedUsername,
          },

          select: {
            id: true,
            username: true,
          },
        });

    if (!user) {
      return null;
    }

    const [
      entries,
      favoriteAnimeCount,
    ] =
      await Promise.all([
        this.prisma
          .animeListEntry
          .findMany({
            where: {
              userId:
                user.id,

              anime: {
                catalogStatus:
                  AnimeCatalogStatus
                    .INCLUDED,
              },
            },

            select:
              statisticsEntrySelect,
          }),

        this.prisma
          .animeFavorite
          .count({
            where: {
              userId:
                user.id,

              anime: {
                catalogStatus:
                  AnimeCatalogStatus
                    .INCLUDED,
              },
            },
          }),
      ]);

    return this.aggregate(
      user.username,
      entries,
      favoriteAnimeCount,
    );
  }

  private aggregate(
    username: string,
    entries:
      StatisticsEntry[],
    favoriteAnimeCount:
      number,
  ): UserStatisticsType {
    const statuses = {
      planning: 0,
      watching: 0,
      completed: 0,
      paused: 0,
      dropped: 0,
      rewatching: 0,
    };

    let episodesLogged = 0;
    let totalRewatches = 0;

    let scoredAnime = 0;
    let scoreTotal = 0;

    const genres =
      new Map<
        string,
        {
          id: string;
          slug: string;
          name: string;
          count: number;
        }
      >();

    for (
      const entry of entries
    ) {
      switch (
        entry.status
      ) {
        case AnimeListStatus
          .PLANNING:
          statuses.planning += 1;
          break;

        case AnimeListStatus
          .WATCHING:
          statuses.watching += 1;
          break;

        case AnimeListStatus
          .COMPLETED:
          statuses.completed += 1;
          break;

        case AnimeListStatus
          .PAUSED:
          statuses.paused += 1;
          break;

        case AnimeListStatus
          .DROPPED:
          statuses.dropped += 1;
          break;

        case AnimeListStatus
          .REWATCHING:
          statuses.rewatching += 1;
          break;
      }

      episodesLogged +=
        entry.progressEpisodes;

      totalRewatches +=
        entry.rewatchCount;

      if (
        entry.score !== null
      ) {
        scoredAnime += 1;

        scoreTotal +=
          entry.score.toNumber();
      }

      for (
        const link of
          entry.anime.genres
      ) {
        const {
          genre,
        } = link;

        const existing =
          genres.get(
            genre.id,
          );

        if (existing) {
          existing.count += 1;

          continue;
        }

        genres.set(
          genre.id,
          {
            id:
              genre.id,

            slug:
              genre.slug,

            name:
              genre.name,

            count: 1,
          },
        );
      }
    }

    const meanScore =
      scoredAnime > 0
        ? Math.round(
            (
              scoreTotal /
              scoredAnime
            ) *
              100,
          ) / 100
        : null;

    const topGenres =
      [...genres.values()]
        .sort(
          (
            first,
            second,
          ) => {
            if (
              first.count !==
              second.count
            ) {
              return (
                second.count -
                first.count
              );
            }

            return first.name
              .localeCompare(
                second.name,
              );
          },
        )
        .slice(
          0,
          10,
        );

    return {
      username,

      totalTracked:
        entries.length,

      ...statuses,

      episodesLogged,
      totalRewatches,

      scoredAnime,
      meanScore,

      favoriteAnimeCount,

      topGenres,
    };
  }
}
