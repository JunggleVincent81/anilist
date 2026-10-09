import {
  createHash,
} from 'node:crypto';

import {
  AnimeFormat,
  AnimeReleaseStatus,
  AnimeSeason,
} from '@prisma/client';

import {
  parseExternalAnimeIdentity,
} from './anime-import-identity.js';

import {
  normalizeSourceImageCandidates,
} from './anime-import-image-candidate.js';

import type {
  ExternalAnimeIdentity,
  NormalizedAnimeRecord,
} from './anime-import.types.js';

function objectValue(
  value: unknown,
): Record<string, unknown> {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    return {};
  }

  return value as Record<
    string,
    unknown
  >;
}

function cleanString(
  value: unknown,
): string | null {
  if (
    typeof value !== 'string'
  ) {
    return null;
  }

  const cleaned =
    value
      .trim()
      .replace(/\s+/g, ' ');

  return cleaned || null;
}

function stringArray(
  value: unknown,
  maxLength: number,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .map(cleanString)
        .filter(
          (
            item,
          ): item is string =>
            item !== null &&
            item.length <=
              maxLength,
        ),
    ),
  ];
}

function mapFormat(
  value: unknown,
): AnimeFormat {
  switch (value) {
    case 'TV':
      return AnimeFormat.TV;

    case 'MOVIE':
      return AnimeFormat.MOVIE;

    case 'OVA':
      return AnimeFormat.OVA;

    case 'ONA':
      return AnimeFormat.ONA;

    case 'SPECIAL':
      return AnimeFormat.SPECIAL;

    case 'MUSIC':
      return AnimeFormat.MUSIC;

    default:
      return AnimeFormat.UNKNOWN;
  }
}

function mapStatus(
  value: unknown,
): AnimeReleaseStatus {
  switch (value) {
    case 'FINISHED':
      return AnimeReleaseStatus
        .FINISHED;

    case 'ONGOING':
      return AnimeReleaseStatus
        .AIRING;

    case 'UPCOMING':
      return AnimeReleaseStatus
        .UPCOMING;

    default:
      return AnimeReleaseStatus
        .UNKNOWN;
  }
}

function mapSeason(
  value: unknown,
): AnimeSeason | null {
  switch (value) {
    case 'WINTER':
      return AnimeSeason.WINTER;

    case 'SPRING':
      return AnimeSeason.SPRING;

    case 'SUMMER':
      return AnimeSeason.SUMMER;

    case 'FALL':
      return AnimeSeason.FALL;

    default:
      return null;
  }
}

function normalizeIdentities(
  value: unknown,
): ExternalAnimeIdentity[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const map =
    new Map<
      string,
      ExternalAnimeIdentity
    >();

  for (
    const rawUrl of value
  ) {
    const sourceUrl =
      cleanString(rawUrl);

    if (!sourceUrl) {
      continue;
    }

    const identity =
      parseExternalAnimeIdentity(
        sourceUrl,
      );

    if (!identity) {
      continue;
    }

    const key =
      `${identity.provider}:${identity.externalId}`;

    map.set(
      key,
      identity,
    );
  }

  return [...map.values()];
}

function positiveIntegerOrNull(
  value: unknown,
): number | null {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value <= 0
  ) {
    return null;
  }

  return value;
}

function normalizeDuration(
  value: unknown,
): number | null {
  const duration =
    objectValue(value);

  if (
    duration.unit !==
      'SECONDS' ||
    typeof duration.value !==
      'number' ||
    duration.value <= 0
  ) {
    return null;
  }

  return Math.max(
    1,
    Math.round(
      duration.value / 60,
    ),
  );
}

function normalizeAnimeRecord(
  value: unknown,
  lineNumber: number,
): NormalizedAnimeRecord {
  const record =
    objectValue(value);

  const title =
    cleanString(
      record.title,
    );

  if (
    !title ||
    title.length > 500
  ) {
    throw new Error(
      `Dataset line ${lineNumber} has an invalid title.`,
    );
  }

  const seasonObject =
    objectValue(
      record.animeSeason,
    );

  const rawYear =
    seasonObject.year;

  const seasonYear =
    typeof rawYear === 'number' &&
    Number.isInteger(rawYear) &&
    rawYear >= 1900 &&
    rawYear <= 2200
      ? rawYear
      : null;

  const externalIds =
    normalizeIdentities(
      record.sources,
    );

  if (
    externalIds.length === 0
  ) {
    throw new Error(
      `Dataset line ${lineNumber} has no usable external identity.`,
    );
  }

  return {
    title,

    format:
      mapFormat(
        record.type,
      ),

    status:
      mapStatus(
        record.status,
      ),

    episodes:
      positiveIntegerOrNull(
        record.episodes,
      ),

    durationMinutes:
      normalizeDuration(
        record.duration,
      ),

    season:
      mapSeason(
        seasonObject.season,
      ),

    seasonYear,

    synonyms:
      stringArray(
        record.synonyms,
        500,
      ).filter(
        (synonym) =>
          synonym !== title,
      ),

    tags:
      stringArray(
        record.tags,
        120,
      ),

    studios:
      stringArray(
        record.studios,
        255,
      ),

    producers:
      stringArray(
        record.producers,
        255,
      ),

    externalIds,

    // Candidate URLs are never persisted or exposed by this importer.
    imageCandidates:
      normalizeSourceImageCandidates(record),

    relatedExternalIds:
      normalizeIdentities(
        record.relatedAnime,
      ),
  };
}

function shortHash(
  value: string,
): string {
  return createHash('sha256')
    .update(value)
    .digest('hex')
    .slice(0, 10);
}

function createSlug(
  value: string,
  maxLength: number,
  fallbackPrefix = 'item',
): string {
  const ascii =
    value
      .normalize('NFKD')
      .replace(
        /[\u0300-\u036f]/g,
        '',
      )
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(
        /[^a-z0-9]+/g,
        '-',
      )
      .replace(
        /^-+|-+$/g,
        '',
      );

  let slug =
    ascii ||
    `${fallbackPrefix}-${shortHash(value)}`;

  if (
    slug.length <= maxLength
  ) {
    return slug;
  }

  const suffix =
    shortHash(value);

  slug =
    `${slug.slice(
      0,
      maxLength -
        suffix.length -
        1,
    )}-${suffix}`;

  return slug.replace(
    /-+$/g,
    '',
  );
}

export {
  createSlug,
  normalizeAnimeRecord,
  shortHash,
};