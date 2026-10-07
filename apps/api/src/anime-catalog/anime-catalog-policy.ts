import {
  AnimeCatalogStatus,
  AnimeFormat,
} from '@prisma/client';

const CATALOG_RULE_VERSION = 1;

type CatalogPolicyInput = {
  title: string;
  format: AnimeFormat;
  tags: string[];
};

type CatalogPolicyResult = {
  status: AnimeCatalogStatus;
  reason: string;
};

function classifyAnimeCatalog(
  input: CatalogPolicyInput,
): CatalogPolicyResult {
  const title =
    input.title
      .trim()
      .toLowerCase();

  const tags =
    new Set(
      input.tags.map(
        (tag) =>
          tag
            .trim()
            .toLowerCase(),
      ),
    );

  if (tags.has('commercials')) {
    return {
      status:
        AnimeCatalogStatus.EXCLUDED,
      reason:
        'AUTO_TAG_COMMERCIALS',
    };
  }

  if (
    title.includes(
      'visualizer',
    )
  ) {
    return {
      status:
        AnimeCatalogStatus.EXCLUDED,
      reason:
        'AUTO_TITLE_VISUALIZER',
    };
  }

  if (
    title.includes(
      'lyric video',
    )
  ) {
    return {
      status:
        AnimeCatalogStatus.EXCLUDED,
      reason:
        'AUTO_TITLE_LYRIC_VIDEO',
    };
  }

  if (
    title.includes(
      'music video making',
    )
  ) {
    return {
      status:
        AnimeCatalogStatus.EXCLUDED,
      reason:
        'AUTO_TITLE_MUSIC_VIDEO_MAKING',
    };
  }

  if (
    title.includes(
      'tv commercial',
    )
  ) {
    return {
      status:
        AnimeCatalogStatus.EXCLUDED,
      reason:
        'AUTO_TITLE_TV_COMMERCIAL',
    };
  }

  if (
    input.format ===
    AnimeFormat.UNKNOWN
  ) {
    return {
      status:
        AnimeCatalogStatus.REVIEW,
      reason:
        'AUTO_FORMAT_UNKNOWN',
    };
  }

  if (
    input.format ===
    AnimeFormat.MUSIC
  ) {
    return {
      status:
        AnimeCatalogStatus.REVIEW,
      reason:
        'AUTO_FORMAT_MUSIC',
    };
  }

  if (
    tags.has(
      'promotional',
    )
  ) {
    return {
      status:
        AnimeCatalogStatus.REVIEW,
      reason:
        'AUTO_TAG_PROMOTIONAL',
    };
  }

  if (
    input.format ===
      AnimeFormat.SPECIAL &&
    tags.has('music')
  ) {
    return {
      status:
        AnimeCatalogStatus.REVIEW,
      reason:
        'AUTO_SPECIAL_MUSIC',
    };
  }

  if (
    title.includes(
      'music video',
    )
  ) {
    return {
      status:
        AnimeCatalogStatus.REVIEW,
      reason:
        'AUTO_TITLE_MUSIC_VIDEO',
    };
  }

  if (
    title.includes(
      'trailer',
    )
  ) {
    return {
      status:
        AnimeCatalogStatus.REVIEW,
      reason:
        'AUTO_TITLE_TRAILER',
    };
  }

  if (
    title.includes(
      'teaser',
    )
  ) {
    return {
      status:
        AnimeCatalogStatus.REVIEW,
      reason:
        'AUTO_TITLE_TEASER',
    };
  }

  return {
    status:
      AnimeCatalogStatus.INCLUDED,
    reason:
      'AUTO_DEFAULT_INCLUDE',
  };
}

export {
  CATALOG_RULE_VERSION,
  classifyAnimeCatalog,
};

export type {
  CatalogPolicyInput,
  CatalogPolicyResult,
};