import {
  Injectable,
} from '@nestjs/common';

import {
  AnimeCatalogStatus,
  Prisma,
} from '@prisma/client';

import {
  PrismaService,
} from '../database/prisma.service.js';

import type {
  AnimeFavoriteType,
  AnimeFavoritesType,
} from './anime-favorites.graphql.js';

import {
  AnimeFavoriteValidationError,
} from './anime-favorites.errors.js';

const animeFavoriteSelect = {
  id: true,
  createdAt: true,

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
} satisfies Prisma.AnimeFavoriteSelect;

type AnimeFavoriteRecord =
  Prisma.AnimeFavoriteGetPayload<{
    select:
      typeof animeFavoriteSelect;
  }>;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const USERNAME_PATTERN =
  /^[a-z0-9_]{3,24}$/;

@Injectable()
export class AnimeFavoritesService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  async findPublic(
    username: string,
  ): Promise<
    AnimeFavoritesType | null
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

    const favorites =
      await this.prisma
        .animeFavorite
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
            animeFavoriteSelect,

          orderBy: [
            {
              createdAt:
                'desc',
            },
            {
              id: 'asc',
            },
          ],
        });

    return {
      username:
        user.username,

      items:
        favorites.map(
          (favorite) =>
            this.mapFavorite(
              favorite,
            ),
        ),
    };
  }

  async findMine(
    userId: string,
    animeId: string,
  ): Promise<
    AnimeFavoriteType | null
  > {
    if (
      !UUID_PATTERN.test(
        animeId,
      )
    ) {
      return null;
    }

    const favorite =
      await this.prisma
        .animeFavorite
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
            animeFavoriteSelect,
        });

    return favorite
      ? this.mapFavorite(
          favorite,
        )
      : null;
  }

  async add(
    userId: string,
    animeId: string,
  ): Promise<
    AnimeFavoriteType
  > {
    if (
      !UUID_PATTERN.test(
        animeId,
      )
    ) {
      throw new AnimeFavoriteValidationError(
        'Anime is not available to favorite.',
      );
    }

    const anime =
      await this.prisma
        .anime
        .findFirst({
          where: {
            id: animeId,

            catalogStatus:
              AnimeCatalogStatus
                .INCLUDED,
          },

          select: {
            id: true,
          },
        });

    if (!anime) {
      throw new AnimeFavoriteValidationError(
        'Anime is not available to favorite.',
      );
    }

    const favorite =
      await this.prisma
        .animeFavorite
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
          },

          update: {},

          select:
            animeFavoriteSelect,
        });

    return this.mapFavorite(
      favorite,
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
        .animeFavorite
        .deleteMany({
          where: {
            userId,
            animeId,
          },
        });

    return result.count > 0;
  }

  private mapFavorite(
    favorite:
      AnimeFavoriteRecord,
  ): AnimeFavoriteType {
    return {
      id:
        favorite.id,

      anime:
        favorite.anime,

      createdAt:
        favorite.createdAt,
    };
  }
}
