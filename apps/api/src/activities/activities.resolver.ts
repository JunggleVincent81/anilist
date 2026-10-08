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
  ActivitiesService,
} from './activities.service.js';

import {
  ActivityValidationError,
} from './activities.errors.js';

import {
  ActivityItemType,
  ActivityPageType,
} from './activities.graphql.js';

import {
  ActivityFeedInput,
} from './dto/activity-feed.input.js';

import {
  CreateTextActivityInput,
} from './dto/create-text-activity.input.js';

@Resolver()
class ActivitiesResolver {
  constructor(
    private readonly activitiesService:
      ActivitiesService,
  ) {}

  @Query(
    () =>
      ActivityPageType,
  )
  publicActivityFeed(
    @Args(
      'input',
      {
        type:
          () =>
            ActivityFeedInput,

        nullable: true,
      },
    )
    input?:
      ActivityFeedInput,
  ): Promise<
    ActivityPageType
  > {
    return this
      .activitiesService
      .findPublicFeed(
        input,
      );
  }

  @Query(
    () =>
      ActivityPageType,
    {
      nullable: true,
    },
  )
  userActivityFeed(
    @Args('username')
    username: string,

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
    ActivityPageType | null
  > {
    return this
      .activitiesService
      .findUserFeed(
        username,

        context
          .currentUser
          ?.id ?? null,

        input,
      );
  }

  @Query(
    () =>
      ActivityPageType,
  )
  @UseGuards(
    RequireAuthGuard,
  )
  followingActivityFeed(
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
    ActivityPageType
  > {
    return this
      .activitiesService
      .findFollowingFeed(
        context
          .currentUser!.id,

        input,
      );
  }

  @Query(
    () =>
      ActivityItemType,
    {
      nullable: true,
    },
  )
  activity(
    @Args(
      'id',
      {
        type: () => ID,
      },
    )
    id: string,

    @Context()
    context:
      GraphQLAuthContext,
  ): Promise<
    ActivityItemType | null
  > {
    return this
      .activitiesService
      .findOne(
        id,

        context
          .currentUser
          ?.id ?? null,
      );
  }

  @Mutation(
    () =>
      ActivityItemType,
  )
  @UseGuards(
    RequireAuthGuard,
  )
  async createTextActivity(
    @Args('input')
    input:
      CreateTextActivityInput,

    @Context()
    context:
      GraphQLAuthContext,
  ): Promise<
    ActivityItemType
  > {
    try {
      return await this
        .activitiesService
        .createText(
          context
            .currentUser!.id,

          input.text,
        );
    } catch (error) {
      if (
        error instanceof
          ActivityValidationError
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

  @Mutation(
    () => Boolean,
  )
  @UseGuards(
    RequireAuthGuard,
  )
  deleteMyActivity(
    @Args(
      'id',
      {
        type: () => ID,
      },
    )
    id: string,

    @Context()
    context:
      GraphQLAuthContext,
  ): Promise<boolean> {
    return this
      .activitiesService
      .deleteMine(
        context
          .currentUser!.id,

        id,
      );
  }
}

export {
  ActivitiesResolver,
};
