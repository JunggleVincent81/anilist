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

export {
  discoverAnime,
};

export type {
  AnimeDiscoveryInput,
  AnimeDiscoveryResult,
  AnimeDiscoverySort,
  AnimeFormat,
  AnimePageInfo,
  AnimeReleaseStatus,
  AnimeSeason,
  AnimeSummary,
};