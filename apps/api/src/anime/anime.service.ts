
import {
  Injectable,
} from '@nestjs/common';

import {
  AnimeCatalogStatus,
  AnimeRelationType as PrismaAnimeRelationType,
  Prisma,
} from '@prisma/client';

import {
  PrismaService,
} from '../database/prisma.service.js';

import {
  AnimeRelationDisplayType,
} from './anime.graphql.js';

import type {
  AnimeType,
} from './anime.graphql.js';

const animeDetailSelect = {
  id: true,
  slug: true,

  title: true,
  titleRomaji: true,
  titleEnglish: true,
  titleNative: true,

  description: true,

  format: true,
  status: true,
  sourceMaterial: true,

  episodes: true,
  durationMinutes: true,

  season: true,
  seasonYear: true,

  startDate: true,
  endDate: true,

  coverImageUrl: true,
  bannerImageUrl: true,

  isAdult: true,

  createdAt: true,
  updatedAt: true,

  titles: {
    select: {
      id: true,
      type: true,
      value: true,
      languageCode: true,
    },
  },

  externalIds: {
    select: {
      provider: true,
      externalId: true,
      sourceUrl: true,
    },
  },

  genres: {
    select: {
      genre: {
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
        },
      },
    },
  },

  tags: {
    select: {
      tag: {
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
        },
      },
    },
  },

  studios: {
    select: {
      role: true,
      isMain: true,

      studio: {
        select: {
          id: true,
          slug: true,
          name: true,
        },
      },
    },
  },

  relationsFrom: {
    where: {
      targetAnime: {
        catalogStatus:
          AnimeCatalogStatus.INCLUDED,
      },
    },

    select: {
      type: true,

      targetAnime: {
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
    },
  },

  relationsTo: {
    where: {
      sourceAnime: {
        catalogStatus:
          AnimeCatalogStatus.INCLUDED,
      },
    },

    select: {
      type: true,

      sourceAnime: {
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
    },
  },
} satisfies Prisma.AnimeSelect;

type AnimeDetailRecord =
  Prisma.AnimeGetPayload<{
    select:
      typeof animeDetailSelect;
  }>;

@Injectable()
export class AnimeService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  async findById(
    id: string,
  ): Promise<AnimeType | null> {
    const normalizedId =
      id.trim();

    if (
      !this.isUuid(
        normalizedId,
      )
    ) {
      return null;
    }

    const anime =
      await this.prisma
        .anime
        .findFirst({
          where: {
            id: normalizedId,
            catalogStatus:
              AnimeCatalogStatus.INCLUDED,
          },

          select:
            animeDetailSelect,
        });

    return anime
      ? this.mapAnime(anime)
      : null;
  }

  async findBySlug(
    slug: string,
  ): Promise<AnimeType | null> {
    const normalizedSlug =
      slug
        .trim()
        .toLowerCase();

    if (
      normalizedSlug.length ===
        0 ||
      normalizedSlug.length >
        220
    ) {
      return null;
    }

    const anime =
      await this.prisma
        .anime
        .findFirst({
          where: {
            slug:
              normalizedSlug,
            catalogStatus:
              AnimeCatalogStatus.INCLUDED,
          },

          select:
            animeDetailSelect,
        });

    return anime
      ? this.mapAnime(anime)
      : null;
  }

  private mapAnime(
    anime:
      AnimeDetailRecord,
  ): AnimeType {
    const titles =
      [...anime.titles]
        .sort((a, b) => {
          const typeCompare =
            a.type.localeCompare(
              b.type,
            );

          if (
            typeCompare !== 0
          ) {
            return typeCompare;
          }

          return a.value
            .localeCompare(
              b.value,
            );
        });

    const externalIds =
      [...anime.externalIds]
        .sort((a, b) => {
          const providerCompare =
            a.provider.localeCompare(
              b.provider,
            );

          if (
            providerCompare !==
            0
          ) {
            return providerCompare;
          }

          return a.externalId
            .localeCompare(
              b.externalId,
            );
        });

    const genres =
      anime.genres
        .map(
          (link) =>
            link.genre,
        )
        .sort((a, b) =>
          a.name.localeCompare(
            b.name,
          ),
        );

    const tags =
      anime.tags
        .map(
          (link) =>
            link.tag,
        )
        .sort((a, b) =>
          a.name.localeCompare(
            b.name,
          ),
        );

    const studios =
      [...anime.studios]
        .sort((a, b) => {
          const roleCompare =
            a.role.localeCompare(
              b.role,
            );

          if (
            roleCompare !== 0
          ) {
            return roleCompare;
          }

          return a.studio.name
            .localeCompare(
              b.studio.name,
            );
        })
        .map(
          (link) => ({
            role:
              link.role,

            isMain:
              link.isMain,

            studio:
              link.studio,
          }),
        );

    const relations = [
      ...anime.relationsFrom.map(
        (relation) => ({
          type:
            this.mapForwardRelation(
              relation.type,
            ),

          anime:
            relation.targetAnime,
        }),
      ),

      ...anime.relationsTo.map(
        (relation) => ({
          type:
            this.mapInverseRelation(
              relation.type,
            ),

          anime:
            relation.sourceAnime,
        }),
      ),
    ].sort((a, b) => {
      const typeCompare =
        a.type.localeCompare(
          b.type,
        );

      if (
        typeCompare !== 0
      ) {
        return typeCompare;
      }

      return a.anime.title
        .localeCompare(
          b.anime.title,
        );
    });

    return {
      id: anime.id,
      slug: anime.slug,

      title: anime.title,

      titleRomaji:
        anime.titleRomaji,

      titleEnglish:
        anime.titleEnglish,

      titleNative:
        anime.titleNative,

      description:
        anime.description,

      format:
        anime.format,

      status:
        anime.status,

      sourceMaterial:
        anime.sourceMaterial,

      episodes:
        anime.episodes,

      durationMinutes:
        anime.durationMinutes,

      season:
        anime.season,

      seasonYear:
        anime.seasonYear,

      startDate:
        anime.startDate,

      endDate:
        anime.endDate,

      coverImageUrl:
        anime.coverImageUrl,

      bannerImageUrl:
        anime.bannerImageUrl,

      isAdult:
        anime.isAdult,

      titles,
      externalIds,
      genres,
      tags,
      studios,
      relations,

      createdAt:
        anime.createdAt,

      updatedAt:
        anime.updatedAt,
    };
  }

  private mapForwardRelation(
    type:
      PrismaAnimeRelationType,
  ): AnimeRelationDisplayType {
    switch (type) {
      case PrismaAnimeRelationType.SEQUEL:
        return AnimeRelationDisplayType.SEQUEL;

      case PrismaAnimeRelationType.SIDE_STORY:
        return AnimeRelationDisplayType.SIDE_STORY;

      case PrismaAnimeRelationType.SPIN_OFF:
        return AnimeRelationDisplayType.SPIN_OFF;

      case PrismaAnimeRelationType.ALTERNATIVE:
        return AnimeRelationDisplayType.ALTERNATIVE;

      case PrismaAnimeRelationType.SUMMARY:
        return AnimeRelationDisplayType.SUMMARY;

      case PrismaAnimeRelationType.COMPILATION:
        return AnimeRelationDisplayType.COMPILATION;

      case PrismaAnimeRelationType.CONTAINS:
        return AnimeRelationDisplayType.CONTAINS;

      case PrismaAnimeRelationType.OTHER:
        return AnimeRelationDisplayType.OTHER;
    }
  }

  private mapInverseRelation(
    type:
      PrismaAnimeRelationType,
  ): AnimeRelationDisplayType {
    switch (type) {
      case PrismaAnimeRelationType.SEQUEL:
        return AnimeRelationDisplayType.PREQUEL;

      case PrismaAnimeRelationType.SIDE_STORY:
      case PrismaAnimeRelationType.SPIN_OFF:
        return AnimeRelationDisplayType.PARENT;

      case PrismaAnimeRelationType.ALTERNATIVE:
        return AnimeRelationDisplayType.ALTERNATIVE;

      case PrismaAnimeRelationType.SUMMARY:
      case PrismaAnimeRelationType.COMPILATION:
        return AnimeRelationDisplayType.SOURCE;

      case PrismaAnimeRelationType.CONTAINS:
        return AnimeRelationDisplayType.PART_OF;

      case PrismaAnimeRelationType.OTHER:
        return AnimeRelationDisplayType.OTHER;
    }
  }

  private isUuid(
    value: string,
  ): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }
}