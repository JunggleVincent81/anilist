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
  ActivityReplyPageType,
  ActivityReplyType,
} from './activities.graphql.js';

import {
  ActivityInteractionsService,
} from './activity-interactions.service.js';

import {
  ActivityInteractionValidationError,
  ActivityUnavailableError,
} from './activity-interactions.errors.js';

import {
  ActivityFeedInput,
} from './dto/activity-feed.input.js';

import {
  CreateActivityReplyInput,
} from './dto/create-activity-reply.input.js';

@Resolver()
class ActivityInteractionsResolver {
  constructor(
    private readonly interactions:
      ActivityInteractionsService,
  ) {}

  @Mutation(
    () => Boolean,
  )
  @UseGuards(
    RequireAuthGuard,
  )
  async likeActivity(
    @Args(
      'activityId',
      {
        type: () => ID,
      },
    )
    activityId: string,

    @Context()
    context:
      GraphQLAuthContext,
  ): Promise<boolean> {
    try {
      return await this
        .interactions
        .like(
          context
            .currentUser!.id,

          activityId,
        );
    } catch (error) {
      this.rethrow(
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
  unlikeActivity(
    @Args(
      'activityId',
      {
        type: () => ID,
      },
    )
    activityId: string,

    @Context()
    context:
      GraphQLAuthContext,
  ): Promise<boolean> {
    return this
      .interactions
      .unlike(
        context
          .currentUser!.id,

        activityId,
      );
  }

  @Query(
    () =>
      ActivityReplyPageType,
    {
      nullable: true,
    },
  )
  activityReplies(
    @Args(
      'activityId',
      {
        type: () => ID,
      },
    )
    activityId: string,

    @Args(
      'input',
      {
        type:
          () =>
            ActivityFeedInput,

        nullable: true,
      },
    )
    input:
      ActivityFeedInput | undefined,

    @Context()
    context:
      GraphQLAuthContext,
  ): Promise<
    ActivityReplyPageType | null
  > {
    return this
      .interactions
      .findReplies(
        activityId,

        context
          .currentUser
          ?.id ?? null,

        input,
      );
  }

  @Mutation(
    () =>
      ActivityReplyType,
  )
  @UseGuards(
    RequireAuthGuard,
  )
  async createActivityReply(
    @Args(
      'activityId',
      {
        type: () => ID,
      },
    )
    activityId: string,

    @Args('input')
    input:
      CreateActivityReplyInput,

    @Context()
    context:
      GraphQLAuthContext,
  ): Promise<
    ActivityReplyType
  > {
    try {
      return await this
        .interactions
        .createReply(
          context
            .currentUser!.id,

          activityId,

          input.body,
        );
    } catch (error) {
      this.rethrow(
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
  deleteMyActivityReply(
    @Args(
      'replyId',
      {
        type: () => ID,
      },
    )
    replyId: string,

    @Context()
    context:
      GraphQLAuthContext,
  ): Promise<boolean> {
    return this
      .interactions
      .deleteMine(
        context
          .currentUser!.id,

        replyId,
      );
  }

  private rethrow(
    error: unknown,
  ): never {
    if (
      error instanceof
        ActivityInteractionValidationError
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

    if (
      error instanceof
        ActivityUnavailableError
    ) {
      throw new GraphQLError(
        error.message,
        {
          extensions: {
            code:
              'NOT_FOUND',
          },
        },
      );
    }

    throw error;
  }
}

export {
  ActivityInteractionsResolver,
};
