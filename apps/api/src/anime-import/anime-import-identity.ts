import {
  createHash,
} from 'node:crypto';

import {
  AnimeDataProvider,
} from '@prisma/client';

import type {
  ExternalAnimeIdentity,
} from './anime-import.types.js';

const MAX_EXTERNAL_ID_LENGTH =
  191;

function hash(
  value: string,
): string {
  return createHash('sha256')
    .update(value)
    .digest('hex')
    .slice(0, 24);
}

function normalizePath(
  path: string,
): string {
  const normalized =
    path.replace(/\/+$/, '');

  return normalized || '/';
}

function boundedExternalId(
  value: string,
): string {
  if (
    value.length <=
    MAX_EXTERNAL_ID_LENGTH
  ) {
    return value;
  }

  return `sha256:${hash(value)}`;
}

function extractPathValue(
  pathname: string,
  prefix: string,
): string | null {
  const normalized =
    normalizePath(pathname);

  if (
    !normalized.startsWith(
      prefix,
    )
  ) {
    return null;
  }

  const value =
    normalized
      .slice(prefix.length)
      .split('/')[0]
      ?.trim();

  return value || null;
}

function normalizeQuery(
  url: URL,
): string {
  const entries = [
    ...url.searchParams.entries(),
  ].sort(
    (
      [leftKey, leftValue],
      [rightKey, rightValue],
    ) => {
      const keyComparison =
        leftKey.localeCompare(
          rightKey,
        );

      if (
        keyComparison !== 0
      ) {
        return keyComparison;
      }

      return leftValue.localeCompare(
        rightValue,
      );
    },
  );

  if (
    entries.length === 0
  ) {
    return '';
  }

  const params =
    new URLSearchParams();

  for (
    const [key, value]
    of entries
  ) {
    params.append(
      key,
      value,
    );
  }

  const query =
    params.toString();

  return query
    ? `?${query}`
    : '';
}

function genericExternalId(
  url: URL,
  host: string,
  pathname: string,
): string {
  return [
    host,
    pathname,
    normalizeQuery(url),
    url.hash,
  ].join('');
}

function parseExternalAnimeIdentity(
  sourceUrl: string,
): ExternalAnimeIdentity | null {
  let url: URL;

  try {
    url =
      new URL(
        sourceUrl,
      );
  } catch {
    return null;
  }

  const host =
    url.hostname
      .toLowerCase()
      .replace(
        /^www\./,
        '',
      );

  const pathname =
    normalizePath(
      url.pathname,
    );

  let provider:
    AnimeDataProvider;

  let externalId:
    string | null = null;

  if (
    host ===
    'myanimelist.net'
  ) {
    provider =
      AnimeDataProvider.MAL;

    externalId =
      extractPathValue(
        pathname,
        '/anime/',
      );
  } else if (
    host ===
    'anilist.co'
  ) {
    provider =
      AnimeDataProvider.ANILIST;

    externalId =
      extractPathValue(
        pathname,
        '/anime/',
      );
  } else if (
    host ===
    'anidb.net'
  ) {
    provider =
      AnimeDataProvider.ANIDB;

    externalId =
      extractPathValue(
        pathname,
        '/anime/',
      );
  } else if (
    host ===
      'kitsu.app' ||
    host ===
      'kitsu.io'
  ) {
    provider =
      AnimeDataProvider.KITSU;

    externalId =
      extractPathValue(
        pathname,
        '/anime/',
      );
  } else if (
    host ===
    'anime-planet.com'
  ) {
    provider =
      AnimeDataProvider
        .ANIME_PLANET;

    externalId =
      extractPathValue(
        pathname,
        '/anime/',
      );
  } else if (
    host ===
    'livechart.me'
  ) {
    provider =
      AnimeDataProvider
        .LIVECHART;

    externalId =
      extractPathValue(
        pathname,
        '/anime/',
      );
  } else if (
    host ===
    'animenewsnetwork.com'
  ) {
    provider =
      AnimeDataProvider.ANN;

    if (
      pathname ===
      '/encyclopedia/anime.php'
    ) {
      externalId =
        url.searchParams
          .get('id')
          ?.trim() ??
        null;
    }
  } else if (
    host ===
    'themoviedb.org'
  ) {
    provider =
      AnimeDataProvider.TMDB;

    const segments =
      pathname
        .split('/')
        .filter(
          Boolean,
        );

    if (
      segments.length >= 2
    ) {
      externalId =
        `${segments[0]}:${segments[1]}`;
    }
  } else if (
    host ===
    'imdb.com'
  ) {
    provider =
      AnimeDataProvider.IMDB;

    externalId =
      extractPathValue(
        pathname,
        '/title/',
      );
  } else {
    provider =
      AnimeDataProvider.OTHER;

    /*
     * Generic providers may encode the
     * resource identity in their query
     * string or fragment.
     *
     * Do not discard those components:
     * doing so can collapse unrelated
     * resources into one identity.
     */
    externalId =
      genericExternalId(
        url,
        host,
        pathname,
      );
  }

  if (!externalId) {
    return null;
  }

  return {
    provider,

    externalId:
      boundedExternalId(
        externalId,
      ),

    sourceUrl:
      url.toString(),
  };
}

function externalIdentityKey(
  identity:
    ExternalAnimeIdentity,
): string {
  return (
    `${identity.provider}:${identity.externalId}`
  );
}

export {
  externalIdentityKey,
  parseExternalAnimeIdentity,
};