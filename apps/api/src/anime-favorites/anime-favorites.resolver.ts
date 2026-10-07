import {
  Args,
  Context,
  ID,
  Mutation,
  Query,
  Resolver,
} from '@nestjs/graphql';

import {
  UseGuards,
} from '@nestjs/common';

import {
  GraphQLError,
} from 'graphql';

import {
  RequireAuthGuard,
} from '../auth/authorization/require-auth.guard.js';

import type {
  GraphQLAuthContext,
} from '../auth/auth.types.js';

import {
  AnimeFavoriteValidationError,
} from './anime-favorites.errors.js';

import {
  AnimeFavoriteType,
  AnimeFavoritesType,
} from './anime-favorites.graphql.js';

import {
  AnimeFavoritesService,
} from './anime-favorites.service.js';

@Resolver()
export class AnimeFavoritesResolver {
  constructor(
    private readonly animeFavoritesService:
      AnimeFavoritesService,
  ) {}

  @Query(
    () => AnimeFavoritesType,
    {
      nullable: true,
    },
  )
  animeFavorites(
    @Args(
      'username',
      {
        type: () =>
          String,
      },
    )
    username: string,
  ): Promise<
    AnimeFavoritesType | null
  > {
    return this
      .animeFavoritesService
      .findPublic(
        username,
      );
  }

  @Query(
    () => AnimeFavoriteType,
    {
      nullable: true,
    },
  )
  @UseGuards(
    RequireAuthGuard,
  )
  myAnimeFavorite(
    @Args(
      'animeId',
      {
        type: () => ID,
      },
    )
    animeId: string,

    @Context()
    context:
      GraphQLAuthContext,
  ): Promise<
    AnimeFavoriteType | null
  > {
    return this
      .animeFavoritesService
      .findMine(
        context
          .currentUser!.id,
        animeId,
      );
  }

  @Mutation(
    () => AnimeFavoriteType,
  )
  @UseGuards(
    RequireAuthGuard,
  )
  async addAnimeFavorite(
    @Args(
      'animeId',
      {
        type: () => ID,
      },
    )
    animeId: string,

    @Context()
    context:
      GraphQLAuthContext,
  ): Promise<
    AnimeFavoriteType
  > {
    try {
      return await this
        .animeFavoritesService
        .add(
          context
            .currentUser!.id,
          animeId,
        );
    } catch (error) {
      this.rethrowDomainError(
        error,
      );
    }
  }

  @Mutation(
    () => Boolean,
  )
  @UseGuards(
    RequireAuthGuard,
  )
  removeAnimeFavorite(
    @Args(
      'animeId',
      {
        type: () => ID,
      },
    )
    animeId: string,

    @Context()
    context:
      GraphQLAuthContext,
  ): Promise<boolean> {
    return this
      .animeFavoritesService
      .remove(
        context
          .currentUser!.id,
        animeId,
      );
  }

  private rethrowDomainError(
    error: unknown,
  ): never {
    if (
      error instanceof
        AnimeFavoriteValidationError
    ) {
      throw new GraphQLError(
        error.message,
        {
          extensions: {
            code:
              'BAD_USER_INPUT',
          },
        },
      );
    }

    throw error;
  }
}
