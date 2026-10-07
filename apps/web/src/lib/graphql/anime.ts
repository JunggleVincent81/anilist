import {
  graphqlRequest,
} from './client';

type AnimeFormat =
  | 'TV'
  | 'MOVIE'
  | 'OVA'
  | 'ONA'
  | 'SPECIAL'
  | 'MUSIC'
  | 'UNKNOWN';

type AnimeReleaseStatus =
  | 'UPCOMING'
  | 'AIRING'
  | 'FINISHED'
  | 'HIATUS'
  | 'CANCELLED'
  | 'UNKNOWN';

type AnimeSeason =
  | 'WINTER'
  | 'SPRING'
  | 'SUMMER'
  | 'FALL';

type AnimeSourceMaterial =
  | 'ORIGINAL'
  | 'MANGA'
  | 'LIGHT_NOVEL'
  | 'NOVEL'
  | 'WEB_NOVEL'
  | 'VISUAL_NOVEL'
  | 'GAME'
  | 'MULTIMEDIA_PROJECT'
  | 'OTHER'
  | 'UNKNOWN';

type AnimeTitleType =
  | 'ROMAJI'
  | 'ENGLISH'
  | 'NATIVE'
  | 'SYNONYM';

type AnimeDataProvider =
  | 'MAL'
  | 'ANILIST'
  | 'ANIDB'
  | 'KITSU'
  | 'ANIME_PLANET'
  | 'LIVECHART'
  | 'ANN'
  | 'TMDB'
  | 'IMDB'
  | 'OTHER';

type AnimeStudioRole =
  | 'ANIMATION'
  | 'PRODUCER';

type AnimeRelationDisplayType =
  | 'SEQUEL'
  | 'PREQUEL'
  | 'SIDE_STORY'
  | 'SPIN_OFF'
  | 'PARENT'
  | 'ALTERNATIVE'
  | 'SUMMARY'
  | 'COMPILATION'
  | 'SOURCE'
  | 'CONTAINS'
  | 'PART_OF'
  | 'OTHER';

type AnimeDiscoverySort =
  | 'TITLE_ASC'
  | 'TITLE_DESC'
  | 'START_DATE_ASC'
  | 'START_DATE_DESC'
  | 'SEASON_YEAR_ASC'
  | 'SEASON_YEAR_DESC';

type AnimeSummary = {
  id: string;
  slug: string;
  title: string;

  format: AnimeFormat;
  status: AnimeReleaseStatus;

  episodes: number | null;

  season: AnimeSeason | null;
  seasonYear: number | null;

  coverImageUrl: string | null;
};

type AnimeAlternateTitle = {
  id: string;
  type: AnimeTitleType;
  value: string;
  languageCode: string | null;
};

type AnimeExternalId = {
  provider: AnimeDataProvider;
  externalId: string;
  sourceUrl: string | null;
};

type AnimeGenre = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

type AnimeTag = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

type AnimeStudio = {
  id: string;
  slug: string;
  name: string;
};

type AnimeStudioCredit = {
  studio: AnimeStudio;
  role: AnimeStudioRole;
  isMain: boolean;
};

type AnimeRelation = {
  type: AnimeRelationDisplayType;
  anime: AnimeSummary;
};

type AnimeDetail = {
  id: string;
  slug: string;

  title: string;

  titleRomaji: string | null;
  titleEnglish: string | null;
  titleNative: string | null;

  description: string | null;

  format: AnimeFormat;
  status: AnimeReleaseStatus;
  sourceMaterial: AnimeSourceMaterial;

  episodes: number | null;
  durationMinutes: number | null;

  season: AnimeSeason | null;
  seasonYear: number | null;

  startDate: string | null;
  endDate: string | null;

  coverImageUrl: string | null;
  bannerImageUrl: string | null;

  isAdult: boolean | null;

  titles: AnimeAlternateTitle[];
  externalIds: AnimeExternalId[];

  genres: AnimeGenre[];
  tags: AnimeTag[];

  studios: AnimeStudioCredit[];

  relations: AnimeRelation[];
};

type AnimePageInfo = {
  page: number;
  perPage: number;

  total: number;
  pageCount: number;

  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type AnimeDiscoveryResult = {
  items: AnimeSummary[];

  pageInfo: AnimePageInfo;
};

type AnimeDiscoveryInput = {
  page?: number;
  perPage?: number;

  search?: string;

  formats?: AnimeFormat[];
  statuses?: AnimeReleaseStatus[];
  seasons?: AnimeSeason[];

  seasonYear?: number;

  genreSlugs?: string[];
  tagSlugs?: string[];
  studioSlugs?: string[];

  sort?: AnimeDiscoverySort;
};

type AnimeDiscoveryResponse = {
  animeDiscovery:
    AnimeDiscoveryResult;
};

type AnimeBySlugResponse = {
  animeBySlug:
    AnimeDetail | null;
};

const ANIME_DISCOVERY_QUERY = `
  query AnimeDiscovery(
    $input: AnimeDiscoveryInput
  ) {
    animeDiscovery(
      input: $input
    ) {
      items {
        id
        slug
        title

        format
        status

        episodes

        season
        seasonYear

        coverImageUrl
      }

      pageInfo {
        page
        perPage

        total
        pageCount

        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

const ANIME_BY_SLUG_QUERY = `
  query AnimeBySlug(
    $slug: String!
  ) {
    animeBySlug(
      slug: $slug
    ) {
      id
      slug

      title

      titleRomaji
      titleEnglish
      titleNative

      description

      format
      status
      sourceMaterial

      episodes
      durationMinutes

      season
      seasonYear

      startDate
      endDate

      coverImageUrl
      bannerImageUrl

      isAdult

      titles {
        id
        type
        value
        languageCode
      }

      externalIds {
        provider
        externalId
        sourceUrl
      }

      genres {
        id
        slug
        name
        description
      }

      tags {
        id
        slug
        name
        description
      }

      studios {
        role
        isMain

        studio {
          id
          slug
          name
        }
      }

      relations {
        type

        anime {
          id
          slug
          title

          format
          status

          episodes

          season
          seasonYear

          coverImageUrl
        }
      }
    }
  }
`;

async function discoverAnime(
  input:
    AnimeDiscoveryInput = {},
): Promise<AnimeDiscoveryResult> {
  const data =
    await graphqlRequest<
      AnimeDiscoveryResponse,
      {
        input:
          AnimeDiscoveryInput;
      }
    >(
      ANIME_DISCOVERY_QUERY,
      {
        input,
      },
    );

  return data.animeDiscovery;
}

async function getAnimeBySlug(
  slug: string,
): Promise<AnimeDetail | null> {
  const data =
    await graphqlRequest<
      AnimeBySlugResponse,
      {
        slug: string;
      }
    >(
      ANIME_BY_SLUG_QUERY,
      {
        slug,
      },
    );

  return data.animeBySlug;
}

export {
  discoverAnime,
  getAnimeBySlug,
};

export type {
  AnimeAlternateTitle,
  AnimeDataProvider,
  AnimeDetail,
  AnimeDiscoveryInput,
  AnimeDiscoveryResult,
  AnimeDiscoverySort,
  AnimeExternalId,
  AnimeFormat,
  AnimeGenre,
  AnimePageInfo,
  AnimeRelation,
  AnimeRelationDisplayType,
  AnimeReleaseStatus,
  AnimeSeason,
  AnimeSourceMaterial,
  AnimeStudio,
  AnimeStudioCredit,
  AnimeStudioRole,
  AnimeSummary,
  AnimeTag,
  AnimeTitleType,
};