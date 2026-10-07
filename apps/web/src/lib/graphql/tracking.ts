import {
  graphqlRequest,
} from './client';

import type {
  AnimeSummary,
} from './anime';

type AnimeListStatus =
  | 'PLANNING'
  | 'WATCHING'
  | 'COMPLETED'
  | 'PAUSED'
  | 'DROPPED'
  | 'REWATCHING';

type AnimeListEntry = {
  id: string;

  status: AnimeListStatus;

  progressEpisodes: number;

  score: number | null;

  rewatchCount: number;

  startedAt: string | null;
  completedAt: string | null;

  anime: AnimeSummary;

  createdAt: string;
  updatedAt: string;
};

type AnimeListPageInfo = {
  page: number;
  perPage: number;

  total: number;
  pageCount: number;

  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type AnimeListPage = {
  username: string;

  entries: AnimeListEntry[];

  pageInfo: AnimeListPageInfo;
};

type AnimeListQueryInput = {
  username: string;

  status?: AnimeListStatus;

  page?: number;
  perPage?: number;
};

type UpsertAnimeListEntryInput = {
  animeId: string;

  status?: AnimeListStatus;

  progressEpisodes?: number;

  score?: number | null;
};

type AnimeListResponse = {
  animeList:
    AnimeListPage | null;
};

type MyAnimeListEntryResponse = {
  myAnimeListEntry:
    AnimeListEntry | null;
};

type UpsertAnimeListEntryResponse = {
  upsertAnimeListEntry:
    AnimeListEntry;
};

type RemoveAnimeListEntryResponse = {
  removeAnimeListEntry:
    boolean;
};

const ANIME_LIST_ENTRY_FIELDS = `
  id

  status

  progressEpisodes
  score
  rewatchCount

  startedAt
  completedAt

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

  createdAt
  updatedAt
`;

const ANIME_LIST_QUERY = `
  query AnimeList(
    $input: AnimeListQueryInput!
  ) {
    animeList(
      input: $input
    ) {
      username

      entries {
        ${ANIME_LIST_ENTRY_FIELDS}
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

const MY_ANIME_LIST_ENTRY_QUERY = `
  query MyAnimeListEntry(
    $animeId: ID!
  ) {
    myAnimeListEntry(
      animeId: $animeId
    ) {
      ${ANIME_LIST_ENTRY_FIELDS}
    }
  }
`;

const UPSERT_ANIME_LIST_ENTRY_MUTATION = `
  mutation UpsertAnimeListEntry(
    $input: UpsertAnimeListEntryInput!
  ) {
    upsertAnimeListEntry(
      input: $input
    ) {
      ${ANIME_LIST_ENTRY_FIELDS}
    }
  }
`;

const REMOVE_ANIME_LIST_ENTRY_MUTATION = `
  mutation RemoveAnimeListEntry(
    $animeId: ID!
  ) {
    removeAnimeListEntry(
      animeId: $animeId
    )
  }
`;

async function getAnimeList(
  input: AnimeListQueryInput,
): Promise<AnimeListPage | null> {
  const data =
    await graphqlRequest<
      AnimeListResponse,
      {
        input:
          AnimeListQueryInput;
      }
    >(
      ANIME_LIST_QUERY,
      {
        input,
      },
    );

  return data.animeList;
}

async function getMyAnimeListEntry(
  animeId: string,
): Promise<
  AnimeListEntry | null
> {
  const data =
    await graphqlRequest<
      MyAnimeListEntryResponse,
      {
        animeId: string;
      }
    >(
      MY_ANIME_LIST_ENTRY_QUERY,
      {
        animeId,
      },
    );

  return data.myAnimeListEntry;
}

async function upsertAnimeListEntry(
  input:
    UpsertAnimeListEntryInput,
): Promise<AnimeListEntry> {
  const data =
    await graphqlRequest<
      UpsertAnimeListEntryResponse,
      {
        input:
          UpsertAnimeListEntryInput;
      }
    >(
      UPSERT_ANIME_LIST_ENTRY_MUTATION,
      {
        input,
      },
    );

  return data.upsertAnimeListEntry;
}

async function removeAnimeListEntry(
  animeId: string,
): Promise<boolean> {
  const data =
    await graphqlRequest<
      RemoveAnimeListEntryResponse,
      {
        animeId: string;
      }
    >(
      REMOVE_ANIME_LIST_ENTRY_MUTATION,
      {
        animeId,
      },
    );

  return data.removeAnimeListEntry;
}

export {
  getAnimeList,
  getMyAnimeListEntry,
  removeAnimeListEntry,
  upsertAnimeListEntry,
};

export type {
  AnimeListEntry,
  AnimeListPage,
  AnimeListPageInfo,
  AnimeListQueryInput,
  AnimeListStatus,
  UpsertAnimeListEntryInput,
};
