import {
  Injectable,
} from '@nestjs/common';

import {
  AnimeCatalogDecisionSource,
  AnimeCatalogStatus,
} from '@prisma/client';

import {
  PrismaService,
} from '../database/prisma.service.js';

import {
  CATALOG_RULE_VERSION,
  classifyAnimeCatalog,
} from './anime-catalog-policy.js';

const BATCH_SIZE = 500;

type ClassificationGroup = {
  status: AnimeCatalogStatus;
  reason: string;
  ids: string[];
};

type AnimeCatalogClassifyResult = {
  processed: number;
  included: number;
  review: number;
  excluded: number;
  manualSkipped: number;
  ruleVersion: number;
};

@Injectable()
export class AnimeCatalogService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  async classifyAll():
    Promise<AnimeCatalogClassifyResult> {
    const manualSkipped =
      await this.prisma
        .anime
        .count({
          where: {
            catalogDecisionSource:
              AnimeCatalogDecisionSource
                .MANUAL,
          },
        });

    const result:
      AnimeCatalogClassifyResult = {
      processed: 0,
      included: 0,
      review: 0,
      excluded: 0,
      manualSkipped,
      ruleVersion:
        CATALOG_RULE_VERSION,
    };

    let cursor:
      string |
      undefined;

    while (true) {
      const anime =
        await this.prisma
          .anime
          .findMany({
            where: {
              catalogDecisionSource:
                AnimeCatalogDecisionSource
                  .AUTO,
            },

            orderBy: {
              id: 'asc',
            },

            take:
              BATCH_SIZE,

            ...(cursor
              ? {
                  cursor: {
                    id:
                      cursor,
                  },
                  skip: 1,
                }
              : {}),

            select: {
              id: true,
              title: true,
              format: true,

              tags: {
                select: {
                  tag: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          });

      if (
        anime.length === 0
      ) {
        break;
      }

      const groups =
        new Map<
          string,
          ClassificationGroup
        >();

      for (
        const record of anime
      ) {
        const classification =
          classifyAnimeCatalog({
            title:
              record.title,

            format:
              record.format,

            tags:
              record.tags.map(
                (item) =>
                  item.tag.name,
              ),
          });

        const key =
          `${classification.status}:${classification.reason}`;

        const group =
          groups.get(key);

        if (group) {
          group.ids.push(
            record.id,
          );
        } else {
          groups.set(
            key,
            {
              status:
                classification.status,
              reason:
                classification.reason,
              ids: [
                record.id,
              ],
            },
          );
        }

        result.processed +=
          1;

        switch (
          classification.status
        ) {
          case AnimeCatalogStatus
            .INCLUDED:
            result.included +=
              1;
            break;

          case AnimeCatalogStatus
            .REVIEW:
            result.review +=
              1;
            break;

          case AnimeCatalogStatus
            .EXCLUDED:
            result.excluded +=
              1;
            break;
        }
      }

      const operations =
        [
          ...groups.values(),
        ].map(
          (group) =>
            this.prisma
              .anime
              .updateMany({
                where: {
                  id: {
                    in:
                      group.ids,
                  },

                  catalogDecisionSource:
                    AnimeCatalogDecisionSource
                      .AUTO,
                },

                data: {
                  catalogStatus:
                    group.status,

                  catalogReason:
                    group.reason,

                  catalogRuleVersion:
                    CATALOG_RULE_VERSION,
                },
              }),
        );

      if (
        operations.length >
        0
      ) {
        await this.prisma
          .$transaction(
            operations,
          );
      }

      cursor =
        anime[
          anime.length - 1
        ].id;
    }

    return result;
  }
}

export type {
  AnimeCatalogClassifyResult,
};