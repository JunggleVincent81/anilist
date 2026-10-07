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
  AnimeListEntryType,
  AnimeListPageType,
} from './anime-tracking.graphql.js';

import {
  AnimeTrackingService,
} from './anime-tracking.service.js';

import {
  AnimeTrackingValidationError,
} from './anime-tracking.errors.js';

import {
  AnimeListQueryInput,
} from './dto/anime-list-query.input.js';

import {
  UpsertAnimeListEntryInput,
} from './dto/upsert-anime-list-entry.input.js';

@Resolver()
export class AnimeTrackingResolver {
  constructor(
    private readonly animeTrackingService:
      AnimeTrackingService,
  ) {}

  @Query(
    () => AnimeListPageType,
    {
      nullable: true,
    },
  )
  animeList(
    @Args('input')
    input:
      AnimeListQueryInput,
  ): Promise<
    AnimeListPageType | null
  > {
    return this
      .animeTrackingService
      .findPublicList(
        input,
      );
  }

  @Query(
    () => AnimeListEntryType,
    {
      nullable: true,
    },
  )
  @UseGuards(
    RequireAuthGuard,
  )
  myAnimeListEntry(
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
    AnimeListEntryType | null
  > {
    return this
      .animeTrackingService
      .findMine(
        context
          .currentUser!.id,
        animeId,
      );
  }

  @Mutation(
    () => AnimeListEntryType,
  )
  @UseGuards(
    RequireAuthGuard,
  )
  async upsertAnimeListEntry(
    @Args('input')
    input:
      UpsertAnimeListEntryInput,

    @Context()
    context:
      GraphQLAuthContext,
  ): Promise<
    AnimeListEntryType
  > {
    try {
      return await this
        .animeTrackingService
        .upsert(
          context
            .currentUser!.id,
          input,
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
  removeAnimeListEntry(
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
      .animeTrackingService
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
        AnimeTrackingValidationError
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
