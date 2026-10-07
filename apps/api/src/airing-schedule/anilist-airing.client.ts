import {
  Injectable,
} from '@nestjs/common';

import {
  AiringScheduleUpstreamError,
} from './airing-schedule.errors.js';

const ANILIST_GRAPHQL_URL =
  'https://graphql.anilist.co';

const PAGE_SIZE = 50;
const MAX_PAGES = 20;

const AIRING_QUERY = `
  query UpcomingAiring(
    $page: Int!
    $perPage: Int!
    $from: Int!
    $to: Int!
  ) {
    Page(
      page: $page
      perPage: $perPage
    ) {
      pageInfo {
        currentPage
        hasNextPage
      }

      airingSchedules(
        airingAt_greater: $from
        airingAt_lesser: $to
        notYetAired: true
      ) {
        id
        airingAt
        episode
        mediaId
      }
    }
  }
`;

type AniListAiringItem = {
  id: number;

  airingAt: number;
  episode: number;
  mediaId: number;
};

type AniListPage = {
  pageInfo: {
    currentPage: number;
    hasNextPage: boolean;
  };

  airingSchedules:
    AniListAiringItem[];
};

type AniListResponse = {
  data?: {
    Page:
      AniListPage | null;
  };

  errors?: Array<{
    message?: string;
  }>;
};

@Injectable()
export class AniListAiringClient {
  async findUpcoming(
    fromUnix: number,
    toUnix: number,
  ): Promise<
    AniListAiringItem[]
  > {
    const items:
      AniListAiringItem[] =
      [];

    let page = 1;
    let hasNextPage = true;

    while (
      hasNextPage &&
      page <= MAX_PAGES
    ) {
      const result =
        await this.fetchPage(
          page,
          fromUnix,
          toUnix,
        );

      items.push(
        ...result.airingSchedules,
      );

      hasNextPage =
        result.pageInfo
          .hasNextPage;

      page += 1;
    }

    if (hasNextPage) {
      throw new AiringScheduleUpstreamError(
        'Airing schedule exceeded the supported upstream pagination limit.',
      );
    }

    return items;
  }

  private async fetchPage(
    page: number,
    fromUnix: number,
    toUnix: number,
  ): Promise<AniListPage> {
    let response: Response;

    try {
      response =
        await fetch(
          ANILIST_GRAPHQL_URL,
          {
            method: 'POST',

            headers: {
              accept:
                'application/json',

              'content-type':
                'application/json',
            },

            body:
              JSON.stringify({
                query:
                  AIRING_QUERY,

                variables: {
                  page,

                  perPage:
                    PAGE_SIZE,

                  from:
                    fromUnix,

                  to:
                    toUnix,
                },
              }),
          },
        );
    } catch {
      throw new AiringScheduleUpstreamError();
    }

    if (!response.ok) {
      throw new AiringScheduleUpstreamError(
        `Airing schedule provider returned HTTP ${response.status}.`,
      );
    }

    let payload:
      AniListResponse;

    try {
      payload =
        await response
          .json() as
          AniListResponse;
    } catch {
      throw new AiringScheduleUpstreamError(
        'Airing schedule provider returned an invalid response.',
      );
    }

    if (
      payload.errors
        ?.length ||
      !payload.data?.Page
    ) {
      throw new AiringScheduleUpstreamError(
        payload.errors?.[0]
          ?.message ??
          'Airing schedule provider returned no data.',
      );
    }

    return payload.data.Page;
  }
}

export type {
  AniListAiringItem,
};
