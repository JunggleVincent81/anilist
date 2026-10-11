import { BadRequestException } from '@nestjs/common';
import { AnimeMangaRelationType, AnimeMusicCategory, CatalogRelationKind, MusicCreditKind } from '@prisma/client';
import type { CreateAdminRelationProposalInput } from './admin-relation-manager.graphql.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
// eslint-disable-next-line no-control-regex -- Deliberately reject control characters in editorial source text.
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/;

function text(value: unknown, label: string, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max || CONTROL.test(value)) {
    throw new BadRequestException(`Invalid ${label}.`);
  }
  return value.trim();
}
function integer(value: unknown, label: string, min: number, max: number): number {
  if (!Number.isSafeInteger(value) || (value as number) < min || (value as number) > max) {
    throw new BadRequestException(`Invalid ${label}.`);
  }
  return value as number;
}
function object(raw: string): Record<string, unknown> {
  if (typeof raw !== 'string' || raw.length < 2 || raw.length > 3000) throw new BadRequestException('Invalid relation detail JSON.');
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new BadRequestException('Invalid relation detail JSON.'); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || Object.getPrototypeOf(parsed) !== Object.prototype) {
    throw new BadRequestException('Relation details must be a JSON object.');
  }
  if (Object.keys(parsed).length > 8) throw new BadRequestException('Too many relation details.');
  return parsed as Record<string, unknown>;
}
function allow(details: Record<string, unknown>, fields: readonly string[]) {
  if (Object.keys(details).some(k => !fields.includes(k))) throw new BadRequestException('Unsupported relation detail.');
}

/** W05 proposals are never publications. Canonical relations are checked against their native schema. */
export function normalizeRelationProposal(input: CreateAdminRelationProposalInput) {
  if (!input || !Object.values(CatalogRelationKind).includes(input.kind)) throw new BadRequestException('Unknown relation type.');
  if (!UUID.test(input.sourceId) || !UUID.test(input.targetId)) throw new BadRequestException('Both entity IDs must be UUIDs.');
  const relationKey = text(input.relationKey, 'relation key', 180);
  const sourceName = text(input.sourceName, 'source name', 150);
  const sourceReference = text(input.sourceReference, 'source reference', 500);
  const details = object(input.detailsJson);
  switch (input.kind) {
    case CatalogRelationKind.ANIME_MANGA:
      allow(details, []);
      if (!Object.values(AnimeMangaRelationType).includes(relationKey as AnimeMangaRelationType)) {
        throw new BadRequestException('Unsupported Anime–Manga relation type.');
      }
      break;
    case CatalogRelationKind.ANIME_MUSIC_USAGE: {
      allow(details, ['usageType', 'episodeStart', 'episodeEnd']);
      if (!Object.values(AnimeMusicCategory).includes(details.usageType as AnimeMusicCategory)) {
        throw new BadRequestException('Invalid music usage type.');
      }
      const hasStart = details.episodeStart !== undefined;
      const hasEnd = details.episodeEnd !== undefined;
      if (hasStart !== hasEnd) throw new BadRequestException('Episode range must include both boundaries.');
      if (hasStart) {
        integer(details.episodeStart, 'episodeStart', 1, 100000);
        integer(details.episodeEnd, 'episodeEnd', 1, 100000);
        if ((details.episodeStart as number) > (details.episodeEnd as number)) throw new BadRequestException('Episode range is reversed.');
      }
      break;
    }
    case CatalogRelationKind.ANIME_EPISODE:
      throw new BadRequestException('AnimeEpisode already owns animeId; links are read only. Use the episode editorial workflow.');
    case CatalogRelationKind.MUSIC_RELEASE_TRACK: {
      allow(details, ['discNumber', 'trackNumber', 'displayTitle']);
      const disc = integer(details.discNumber, 'disc number', 1, 999);
      const track = integer(details.trackNumber, 'track number', 1, 9999);
      if (relationKey !== `${disc}:${track}`) throw new BadRequestException('Slot key does not match disc and track.');
      if (details.displayTitle !== undefined) details.displayTitle = text(details.displayTitle, 'display title', 500);
      break;
    }
    default: {
      allow(details, ['creditKind', 'role', 'creditedAs', 'position']);
      const kind = details.creditKind;
      if (!Object.values(MusicCreditKind).includes(kind as MusicCreditKind)) throw new BadRequestException('Invalid music credit kind.');
      const role = text(details.role, 'credit role', 100);
      if (relationKey !== `${kind}:${role.toLowerCase()}`) throw new BadRequestException('Credit key does not match role.');
      details.role = role;
      if (details.creditedAs !== undefined) details.creditedAs = text(details.creditedAs, 'credited as', 250);
      if (details.position !== undefined) integer(details.position, 'position', 0, 100000);
    }
  }
  return { kind: input.kind, sourceId: input.sourceId, targetId: input.targetId,
    relationKey, sourceName, sourceReference, details };
}
