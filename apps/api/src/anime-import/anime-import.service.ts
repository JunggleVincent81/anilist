import {
  randomUUID,
} from 'node:crypto';

import {
  Injectable,
  Logger,
} from '@nestjs/common';

import {
  canMergeByExternalIdentity,
} from './anime-import-identity-policy.js';

import {
  AnimeFormat,
  AnimeRelationType,
  AnimeReleaseStatus,
  AnimeSeason,
  AnimeSourceMaterial,
  AnimeStudioRole,
  AnimeTitleType,
} from '@prisma/client';

import type {
  Prisma,
} from '@prisma/client';

import {
  PrismaService,
} from '../database/prisma.service.js';

import {
  externalIdentityKey,
} from './anime-import-identity.js';

import {
  createSlug,
  normalizeAnimeRecord,
  shortHash,
} from './anime-import-normalizer.js';

import {
  streamAnimeDataset,
} from './anime-import-source.js';

import type {
  AnimeImportOptions,
  AnimeImportStats,
  ExternalAnimeIdentity,
  NormalizedAnimeRecord,
} from './anime-import.types.js';

type AnimeState = {
  id: string;
  slug: string;
  title: string;

  format: AnimeFormat;
  status: AnimeReleaseStatus;

  episodes: number | null;
  durationMinutes: number | null;

  season: AnimeSeason | null;
  seasonYear: number | null;
};

type ImportContext = {
  identityIndex:
    Map<string, string>;

  animeStates:
    Map<string, AnimeState>;

  usedAnimeSlugs:
    Set<string>;

  tagIds:
    Map<string, string>;

  studioIds:
    Map<string, string>;
};

type RelationPair = {
  sourceAnimeId: string;
  targetAnimeId: string;
};

const RELATION_BATCH_SIZE =
  1000;

@Injectable()
export class AnimeImportService {
  private readonly logger =
    new Logger(
      AnimeImportService.name,
    );

  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  async importFile(
    filePath: string,
    options:
      AnimeImportOptions = {},
  ): Promise<AnimeImportStats> {
    const stats:
      AnimeImportStats = {
        processed: 0,
        created: 0,
        existing: 0,

        relationsCreated: 0,
        unresolvedRelations: 0,

        startedAt:
          new Date(),

        finishedAt: null,
      };

    this.logger.log(
      `Importing anime dataset: ${filePath}`,
    );

    /*
     * Dry run intentionally avoids
     * all database writes.
     */
    if (options.dryRun) {
      for await (
        const datasetLine of
        streamAnimeDataset(
          filePath,
        )
      ) {
        if (
          options.limit !==
            undefined &&
          stats.processed >=
            options.limit
        ) {
          break;
        }

        normalizeAnimeRecord(
          datasetLine.value,
          datasetLine.lineNumber,
        );

        stats.processed += 1;
      }

      stats.finishedAt =
        new Date();

      return stats;
    }

    const context =
      await this.createImportContext();

    for await (
      const datasetLine of
      streamAnimeDataset(
        filePath,
      )
    ) {
      if (
        options.limit !==
          undefined &&
        stats.processed >=
          options.limit
      ) {
        break;
      }

      const record =
        normalizeAnimeRecord(
          datasetLine.value,
          datasetLine.lineNumber,
        );

      stats.processed += 1;

      const result =
        await this.importAnime(
          record,
          context,
        );

      if (result.created) {
        stats.created += 1;
      } else {
        stats.existing += 1;
      }

      if (
        stats.processed %
          100 ===
        0
      ) {
        this.logger.log(
          `Imported ${stats.processed} records.`,
        );
      }
    }

    if (
      !options.skipRelations
    ) {
      await this.importRelations(
        filePath,
        context.identityIndex,
        stats,
        options.limit,
      );
    }

    stats.finishedAt =
      new Date();

    return stats;
  }

  private async createImportContext():
    Promise<ImportContext> {
    const [
      externalIds,
      anime,
      tags,
      studios,
    ] =
      await Promise.all([
        this.prisma
          .externalAnimeId
          .findMany({
            select: {
              provider: true,
              externalId: true,
              animeId: true,
            },
          }),

        this.prisma.anime
          .findMany({
            select: {
              id: true,
              slug: true,
              title: true,

              format: true,
              status: true,

              episodes: true,
              durationMinutes: true,

              season: true,
              seasonYear: true,
            },
          }),

        this.prisma.tag
          .findMany({
            select: {
              id: true,
              slug: true,
            },
          }),

        this.prisma.studio
          .findMany({
            select: {
              id: true,
              slug: true,
            },
          }),
      ]);

    const identityIndex =
      new Map<
        string,
        string
      >();

    for (
      const identity of
      externalIds
    ) {
      const key =
        `${identity.provider}:${identity.externalId}`;

      const previous =
        identityIndex.get(key);

      if (
        previous &&
        previous !==
          identity.animeId
      ) {
        throw new Error(
          `Database identity collision for ${key}.`,
        );
      }

      identityIndex.set(
        key,
        identity.animeId,
      );
    }

    const animeStates =
      new Map<
        string,
        AnimeState
      >();

    const usedAnimeSlugs =
      new Set<string>();

    for (
      const item of anime
    ) {
      animeStates.set(
        item.id,
        item,
      );

      usedAnimeSlugs.add(
        item.slug,
      );
    }

    const tagIds =
      new Map<
        string,
        string
      >();

    for (
      const tag of tags
    ) {
      tagIds.set(
        tag.slug,
        tag.id,
      );
    }

    const studioIds =
      new Map<
        string,
        string
      >();

    for (
      const studio of
      studios
    ) {
      studioIds.set(
        studio.slug,
        studio.id,
      );
    }

    this.logger.log(
      [
        'Import cache loaded:',
        `${animeStates.size} anime,`,
        `${identityIndex.size} identities,`,
        `${tagIds.size} tags,`,
        `${studioIds.size} studios.`,
      ].join(' '),
    );

    return {
      identityIndex,
      animeStates,
      usedAnimeSlugs,
      tagIds,
      studioIds,
    };
  }

  private async importAnime(
    record:
      NormalizedAnimeRecord,
    context:
      ImportContext,
  ): Promise<{
    animeId: string;
    created: boolean;
  }> {
    const matchingAnimeIds =
      new Set<string>();

    for (
      const identity of
      record.externalIds
    ) {
      if (
        !canMergeByExternalIdentity(
          identity.provider,
        )
      ) {
        continue;
      }

      const animeId =
        context.identityIndex.get(
          externalIdentityKey(
            identity,
          ),
        );

      if (animeId) {
        matchingAnimeIds.add(
          animeId,
        );
      }
    }

    if (
      matchingAnimeIds.size > 1
    ) {
      throw new Error(
        `External identity conflict for "${record.title}": ${[
          ...matchingAnimeIds,
        ].join(', ')}`,
      );
    }

    const existingAnimeId =
      [
        ...matchingAnimeIds,
      ][0] ?? null;

    const created =
      existingAnimeId === null;

    const animeId =
      existingAnimeId ??
      randomUUID();

    let existingState:
      AnimeState | null = null;

    if (existingAnimeId) {
      existingState =
        context.animeStates.get(
          existingAnimeId,
        ) ?? null;

      if (!existingState) {
        throw new Error(
          `Anime ${existingAnimeId} exists in identity index but not anime cache.`,
        );
      }
    }

    /*
     * Validate external identities before
     * touching the database.
     */
    const newExternalIds:
      ExternalAnimeIdentity[] =
      [];

    for (
      const identity of
      record.externalIds
    ) {
      const key =
        externalIdentityKey(
          identity,
        );

      const currentAnimeId =
        context.identityIndex.get(
          key,
        );

      if (
        currentAnimeId &&
        currentAnimeId !==
          animeId
      ) {
        throw new Error(
          `External identity ${key} belongs to anime ${currentAnimeId}, not ${animeId}.`,
        );
      }

      if (!currentAnimeId) {
        newExternalIds.push(
          identity,
        );
      }
    }

    const tagIds =
      await this.ensureTagIds(
        record.tags,
        context,
      );

    const animationStudioIds =
      await this.ensureStudioIds(
        record.studios,
        context,
      );

    const producerStudioIds =
      await this.ensureStudioIds(
        record.producers,
        context,
      );

    const synonyms =
      new Set(
        record.synonyms,
      );

    /*
     * Preserve a different incoming
     * canonical title instead of losing it
     * during identity deduplication.
     */
    if (
      existingState &&
      !this.sameTitle(
        existingState.title,
        record.title,
      )
    ) {
      synonyms.add(
        record.title,
      );
    }

    const slug =
      created
        ? this.reserveAnimeSlug(
            record,
            context
              .usedAnimeSlugs,
          )
        : existingState!.slug;

    const updateData =
      existingState
        ? this.buildEnrichmentUpdate(
            existingState,
            record,
          )
        : null;

    await this.prisma.$transaction(
      async (tx) => {
        if (created) {
          await tx.anime.create({
            data: {
              id: animeId,

              slug,
              title:
                record.title,

              format:
                record.format,

              status:
                record.status,

              sourceMaterial:
                AnimeSourceMaterial.UNKNOWN,

              episodes:
                record.episodes,

              durationMinutes:
                record.durationMinutes,

              season:
                record.season,

              seasonYear:
                record.seasonYear,

              isAdult: null,
            },
          });
        } else if (
          updateData &&
          Object.keys(
            updateData,
          ).length > 0
        ) {
          await tx.anime.update({
            where: {
              id: animeId,
            },

            data:
              updateData,
          });
        }

        if (
          newExternalIds.length > 0
        ) {
          await tx.externalAnimeId
            .createMany({
              data:
                newExternalIds.map(
                  (identity) => ({
                    animeId,

                    provider:
                      identity.provider,

                    externalId:
                      identity.externalId,

                    sourceUrl:
                      identity.sourceUrl,
                  }),
                ),

              skipDuplicates: true,
            });
        }

        if (
          synonyms.size > 0
        ) {
          await tx.animeTitle
            .createMany({
              data: [
                ...synonyms,
              ].map(
                (value) => ({
                  animeId,

                  type:
                    AnimeTitleType
                      .SYNONYM,

                  value,

                  languageCode:
                    null,
                }),
              ),

              skipDuplicates: true,
            });
        }

        if (
          tagIds.length > 0
        ) {
          await tx.animeTag
            .createMany({
              data:
                tagIds.map(
                  (tagId) => ({
                    animeId,
                    tagId,
                  }),
                ),

              skipDuplicates: true,
            });
        }

        const studioLinks = [
          ...animationStudioIds.map(
            (studioId) => ({
              animeId,

              studioId,

              role:
                AnimeStudioRole
                  .ANIMATION,

              isMain: false,
            }),
          ),

          ...producerStudioIds.map(
            (studioId) => ({
              animeId,

              studioId,

              role:
                AnimeStudioRole
                  .PRODUCER,

              isMain: false,
            }),
          ),
        ];

        if (
          studioLinks.length > 0
        ) {
          await tx.animeStudio
            .createMany({
              data:
                studioLinks,

              skipDuplicates: true,
            });
        }
      },
    );

    /*
     * Only mutate caches after the
     * transaction succeeds.
     */
    if (created) {
      context.animeStates.set(
        animeId,
        {
          id: animeId,
          slug,

          title:
            record.title,

          format:
            record.format,

          status:
            record.status,

          episodes:
            record.episodes,

          durationMinutes:
            record.durationMinutes,

          season:
            record.season,

          seasonYear:
            record.seasonYear,
        },
      );

      context.usedAnimeSlugs.add(
        slug,
      );
    } else {
      this.applyEnrichmentToState(
        existingState!,
        record,
      );
    }

    for (
      const identity of
      record.externalIds
    ) {
      context.identityIndex.set(
        externalIdentityKey(
          identity,
        ),
        animeId,
      );
    }

    return {
      animeId,
      created,
    };
  }

  private buildEnrichmentUpdate(
    state:
      AnimeState,
    record:
      NormalizedAnimeRecord,
  ): Prisma.AnimeUpdateInput {
    const data:
      Prisma.AnimeUpdateInput = {};

    if (
      state.format ===
        AnimeFormat.UNKNOWN &&
      record.format !==
        AnimeFormat.UNKNOWN
    ) {
      data.format =
        record.format;
    }

    if (
      state.status ===
        AnimeReleaseStatus.UNKNOWN &&
      record.status !==
        AnimeReleaseStatus.UNKNOWN
    ) {
      data.status =
        record.status;
    }

    if (
      state.episodes ===
        null &&
      record.episodes !== null
    ) {
      data.episodes =
        record.episodes;
    }

    if (
      state.durationMinutes ===
        null &&
      record.durationMinutes !==
        null
    ) {
      data.durationMinutes =
        record.durationMinutes;
    }

    if (
      state.season ===
        null &&
      record.season !== null
    ) {
      data.season =
        record.season;
    }

    if (
      state.seasonYear ===
        null &&
      record.seasonYear !==
        null
    ) {
      data.seasonYear =
        record.seasonYear;
    }

    return data;
  }

  private applyEnrichmentToState(
    state:
      AnimeState,
    record:
      NormalizedAnimeRecord,
  ): void {
    if (
      state.format ===
        AnimeFormat.UNKNOWN &&
      record.format !==
        AnimeFormat.UNKNOWN
    ) {
      state.format =
        record.format;
    }

    if (
      state.status ===
        AnimeReleaseStatus.UNKNOWN &&
      record.status !==
        AnimeReleaseStatus.UNKNOWN
    ) {
      state.status =
        record.status;
    }

    if (
      state.episodes ===
        null &&
      record.episodes !== null
    ) {
      state.episodes =
        record.episodes;
    }

    if (
      state.durationMinutes ===
        null &&
      record.durationMinutes !==
        null
    ) {
      state.durationMinutes =
        record.durationMinutes;
    }

    if (
      state.season ===
        null &&
      record.season !== null
    ) {
      state.season =
        record.season;
    }

    if (
      state.seasonYear ===
        null &&
      record.seasonYear !==
        null
    ) {
      state.seasonYear =
        record.seasonYear;
    }
  }

  private async ensureTagIds(
    names: string[],
    context:
      ImportContext,
  ): Promise<string[]> {
    const ids =
      new Set<string>();

    for (
      const name of names
    ) {
      const slug =
        createSlug(
          name,
          120,
          'tag',
        );

      let tagId =
        context.tagIds.get(
          slug,
        );

      if (!tagId) {
        const tag =
          await this.prisma.tag.upsert({
            where: {
              slug,
            },

            create: {
              slug,
              name,
            },

            update: {},

            select: {
              id: true,
            },
          });

        tagId = tag.id;

        context.tagIds.set(
          slug,
          tagId,
        );
      }

      ids.add(tagId);
    }

    return [...ids];
  }

  private async ensureStudioIds(
    names: string[],
    context:
      ImportContext,
  ): Promise<string[]> {
    const ids =
      new Set<string>();

    for (
      const name of names
    ) {
      const slug =
        createSlug(
          name,
          160,
          'studio',
        );

      let studioId =
        context.studioIds.get(
          slug,
        );

      if (!studioId) {
        const studio =
          await this.prisma.studio
            .upsert({
              where: {
                slug,
              },

              create: {
                slug,
                name,
              },

              update: {},

              select: {
                id: true,
              },
            });

        studioId =
          studio.id;

        context.studioIds.set(
          slug,
          studioId,
        );
      }

      ids.add(
        studioId,
      );
    }

    return [...ids];
  }

  private reserveAnimeSlug(
    record:
      NormalizedAnimeRecord,
    usedSlugs:
      Set<string>,
  ): string {
    const base =
      createSlug(
        record.title,
        220,
        'anime',
      );

    if (
      !usedSlugs.has(
        base,
      )
    ) {
      return base;
    }

    const identity =
      record.externalIds[0];

    if (identity) {
      const suffix =
        createSlug(
          `${identity.provider}-${identity.externalId}`,
          60,
          'source',
        );

      const baseLength =
        220 -
        suffix.length -
        1;

      const candidate =
        `${base.slice(
          0,
          baseLength,
        )}-${suffix}`;

      if (
        !usedSlugs.has(
          candidate,
        )
      ) {
        return candidate;
      }
    }

    const identitySeed =
      record.externalIds
        .map(
          externalIdentityKey,
        )
        .sort()
        .join('|');

    for (
      let attempt = 0;
      attempt < 1000;
      attempt += 1
    ) {
      const suffix =
        shortHash(
          `${record.title}:${identitySeed}:${attempt}`,
        );

      const baseLength =
        220 -
        suffix.length -
        1;

      const candidate =
        `${base.slice(
          0,
          baseLength,
        )}-${suffix}`;

      if (
        !usedSlugs.has(
          candidate,
        )
      ) {
        return candidate;
      }
    }

    throw new Error(
      `Unable to generate unique slug for "${record.title}".`,
    );
  }

  private sameTitle(
    left: string,
    right: string,
  ): boolean {
    const normalize = (
      value: string,
    ) =>
      value
        .normalize('NFKC')
        .trim()
        .replace(
          /\s+/g,
          ' ',
        )
        .toLocaleLowerCase(
          'en-US',
        );

    return (
      normalize(left) ===
      normalize(right)
    );
  }

  private async importRelations(
    filePath: string,
    identityIndex:
      Map<string, string>,
    stats:
      AnimeImportStats,
    limit?: number,
  ): Promise<void> {
    this.logger.log(
      'Importing anime relations.',
    );

    const pairs =
      new Map<
        string,
        RelationPair
      >();

    let processed = 0;

    for await (
      const datasetLine of
      streamAnimeDataset(
        filePath,
      )
    ) {
      if (
        limit !== undefined &&
        processed >= limit
      ) {
        break;
      }

      const record =
        normalizeAnimeRecord(
          datasetLine.value,
          datasetLine.lineNumber,
        );

      processed += 1;

      const sourceAnimeId =
        this.resolveAnimeIdFromIndex(
          record.externalIds,
          identityIndex,
        );

      if (!sourceAnimeId) {
        continue;
      }

      for (
        const identity of
        record.relatedExternalIds
      ) {
        const targetAnimeId =
          identityIndex.get(
            externalIdentityKey(
              identity,
            ),
          );

        if (!targetAnimeId) {
          stats.unresolvedRelations +=
            1;

          continue;
        }

        if (
          targetAnimeId ===
          sourceAnimeId
        ) {
          continue;
        }

        const [
          canonicalSource,
          canonicalTarget,
        ] =
          [
            sourceAnimeId,
            targetAnimeId,
          ].sort();

        const key =
          `${canonicalSource}:${canonicalTarget}`;

        pairs.set(
          key,
          {
            sourceAnimeId:
              canonicalSource,

            targetAnimeId:
              canonicalTarget,
          },
        );
      }
    }

    const relationRows =
      [...pairs.values()];

    for (
      let index = 0;
      index <
      relationRows.length;
      index +=
        RELATION_BATCH_SIZE
    ) {
      const batch =
        relationRows.slice(
          index,
          index +
            RELATION_BATCH_SIZE,
        );

      const result =
        await this.prisma
          .animeRelation
          .createMany({
            data:
              batch.map(
                (pair) => ({
                  ...pair,

                  type:
                    AnimeRelationType
                      .OTHER,
                }),
              ),

            skipDuplicates: true,
          });

      stats.relationsCreated +=
        result.count;
    }
  }

  private resolveAnimeIdFromIndex(
    identities:
      ExternalAnimeIdentity[],
    identityIndex:
      Map<string, string>,
  ): string | null {
    const ids =
      new Set<string>();

    for (
      const identity of
      identities
    ) {
      const animeId =
        identityIndex.get(
          externalIdentityKey(
            identity,
          ),
        );

      if (animeId) {
        ids.add(animeId);
      }
    }

    if (ids.size > 1) {
      throw new Error(
        `Related anime identity conflict: ${[
          ...ids,
        ].join(', ')}`,
      );
    }

    return (
      [...ids][0] ??
      null
    );
  }
}