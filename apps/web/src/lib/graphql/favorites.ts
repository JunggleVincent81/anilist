import {
  graphqlRequest,
} from './client';

import type {
  AnimeSummary,
} from './anime';

type AnimeFavorite = {
  id: string;

  anime: AnimeSummary;

  createdAt: string;
};

type AnimeFavorites = {
  username: string;

  items: AnimeFavorite[];
};

type AnimeFavoritesResponse = {
  animeFavorites:
    AnimeFavorites | null;
};

type MyAnimeFavoriteResponse = {
  myAnimeFavorite:
    AnimeFavorite | null;
};

type AddAnimeFavoriteResponse = {
  addAnimeFavorite:
    AnimeFavorite;
};

type RemoveAnimeFavoriteResponse = {
  removeAnimeFavorite:
    boolean;
};

const ANIME_FAVORITE_FIELDS = `
  id

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
`;

const ANIME_FAVORITES_QUERY = `
  query AnimeFavorites(
    $username: String!
  ) {
    animeFavorites(
      username: $username
    ) {
      username

      items {
        ${ANIME_FAVORITE_FIELDS}
      }
    }
  }
`;

const MY_ANIME_FAVORITE_QUERY = `
  query MyAnimeFavorite(
    $animeId: ID!
  ) {
    myAnimeFavorite(
      animeId: $animeId
    ) {
      ${ANIME_FAVORITE_FIELDS}
    }
  }
`;

const ADD_ANIME_FAVORITE_MUTATION = `
  mutation AddAnimeFavorite(
    $animeId: ID!
  ) {
    addAnimeFavorite(
      animeId: $animeId
    ) {
      ${ANIME_FAVORITE_FIELDS}
    }
  }
`;

const REMOVE_ANIME_FAVORITE_MUTATION = `
  mutation RemoveAnimeFavorite(
    $animeId: ID!
  ) {
    removeAnimeFavorite(
      animeId: $animeId
    )
  }
`;

async function getAnimeFavorites(
  username: string,
): Promise<
  AnimeFavorites | null
> {
  const data =
    await graphqlRequest<
      AnimeFavoritesResponse,
      {
        username: string;
      }
    >(
      ANIME_FAVORITES_QUERY,
      {
        username,
      },
    );

  return data.animeFavorites;
}

async function getMyAnimeFavorite(
  animeId: string,
): Promise<
  AnimeFavorite | null
> {
  const data =
    await graphqlRequest<
      MyAnimeFavoriteResponse,
      {
        animeId: string;
      }
    >(
      MY_ANIME_FAVORITE_QUERY,
      {
        animeId,
      },
    );

  return data.myAnimeFavorite;
}

async function addAnimeFavorite(
  animeId: string,
): Promise<
  AnimeFavorite
> {
  const data =
    await graphqlRequest<
      AddAnimeFavoriteResponse,
      {
        animeId: string;
      }
    >(
      ADD_ANIME_FAVORITE_MUTATION,
      {
        animeId,
      },
    );

  return data.addAnimeFavorite;
}

async function removeAnimeFavorite(
  animeId: string,
): Promise<boolean> {
  const data =
    await graphqlRequest<
      RemoveAnimeFavoriteResponse,
      {
        animeId: string;
      }
    >(
      REMOVE_ANIME_FAVORITE_MUTATION,
      {
        animeId,
      },
    );

  return data.removeAnimeFavorite;
}

export {
  addAnimeFavorite,
  getAnimeFavorites,
  getMyAnimeFavorite,
  removeAnimeFavorite,
};

export type {
  AnimeFavorite,
  AnimeFavorites,
};
