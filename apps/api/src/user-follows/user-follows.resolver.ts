import {
  Args,
  Context,
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
  UserFollowListInput,
} from './dto/user-follow-list.input.js';

import {
  UserFollowValidationError,
} from './user-follows.errors.js';

import {
  UserFollowPageType,
  UserFollowStatusType,
  UserFollowSummaryType,
} from './user-follows.graphql.js';

import {
  UserFollowsService,
} from './user-follows.service.js';

@Resolver()
class UserFollowsResolver {
  constructor(
    private readonly userFollowsService:
      UserFollowsService,
  ) {}

  @Query(
    () =>
      UserFollowSummaryType,
    {
      nullable: true,
    },
  )
  userFollowSummary(
    @Args(
      'username',
      {
        type: () =>
          String,
      },
    )
    username: string,
  ): Promise<
    UserFollowSummaryType | null
  > {
    return this
      .userFollowsService
      .findSummary(
        username,
      );
  }

  @Query(
    () =>
      UserFollowPageType,
    {
      nullable: true,
    },
  )
  userFollowers(
    @Args('input')
    input:
      UserFollowListInput,
  ): Promise<
    UserFollowPageType | null
  > {
    return this
      .userFollowsService
      .findFollowers(
        input,
      );
  }

  @Query(
    () =>
      UserFollowPageType,
    {
      nullable: true,
    },
  )
  userFollowing(
    @Args('input')
    input:
      UserFollowListInput,
  ): Promise<
    UserFollowPageType | null
  > {
    return this
      .userFollowsService
      .findFollowing(
        input,
      );
  }

  @Query(
    () =>
      UserFollowStatusType,
    {
      nullable: true,
    },
  )
  @UseGuards(
    RequireAuthGuard,
  )
  myFollowStatus(
    @Args(
      'username',
      {
        type: () =>
          String,
      },
    )
    username: string,

    @Context()
    context:
      GraphQLAuthContext,
  ): Promise<
    UserFollowStatusType | null
  > {
    return this
      .userFollowsService
      .findStatus(
        context
          .currentUser!.id,

        username,
      );
  }

  @Mutation(
    () =>
      UserFollowStatusType,
  )
  @UseGuards(
    RequireAuthGuard,
  )
  async followUser(
    @Args(
      'username',
      {
        type: () =>
          String,
      },
    )
    username: string,

    @Context()
    context:
      GraphQLAuthContext,
  ): Promise<
    UserFollowStatusType
  > {
    try {
      return await this
        .userFollowsService
        .follow(
          context
            .currentUser!.id,

          username,
        );
    } catch (error) {
      this.rethrowDomainError(
        error,
      );
    }
  }

  @Mutation(
    () =>
      UserFollowStatusType,
  )
  @UseGuards(
    RequireAuthGuard,
  )
  async unfollowUser(
    @Args(
      'username',
      {
        type: () =>
          String,
      },
    )
    username: string,

    @Context()
    context:
      GraphQLAuthContext,
  ): Promise<
    UserFollowStatusType
  > {
    try {
      return await this
        .userFollowsService
        .unfollow(
          context
            .currentUser!.id,

          username,
        );
    } catch (error) {
      this.rethrowDomainError(
        error,
      );
    }
  }

  private rethrowDomainError(
    error: unknown,
  ): never {
    if (
      error instanceof
        UserFollowValidationError
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

export {
  UserFollowsResolver,
};
