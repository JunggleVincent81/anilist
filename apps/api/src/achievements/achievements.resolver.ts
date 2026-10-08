import {
  UseGuards,
} from '@nestjs/common';

import {
  Args,
  Context,
  ID,
  Int,
  Mutation,
  Query,
  Resolver,
} from '@nestjs/graphql';

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
  AchievementEvaluatorService,
} from './achievement-evaluator.service.js';

import {
  AchievementValidationError,
} from './achievements.errors.js';

import {
  AchievementEvaluationResultType,
  AchievementProfileType,
} from './achievements.graphql.js';

import {
  AchievementsService,
} from './achievements.service.js';

@Resolver()
export class AchievementsResolver {
  constructor(
    private readonly achievementsService:
      AchievementsService,

    private readonly evaluator:
      AchievementEvaluatorService,
  ) {}

  @Query(
    () =>
      AchievementProfileType,
    {
      nullable: true,
    },
  )
  userAchievements(
    @Args(
      'username',
      {
        type: () =>
          String,
      },
    )
    username: string,
  ): Promise<
    AchievementProfileType | null
  > {
    return this
      .achievementsService
      .findPublic(
        username,
      );
  }

  @Query(
    () =>
      AchievementProfileType,
    {
      nullable: true,
    },
  )
  @UseGuards(
    RequireAuthGuard,
  )
  myAchievements(
    @Context()
    context:
      GraphQLAuthContext,
  ): Promise<
    AchievementProfileType | null
  > {
    return this
      .achievementsService
      .findByUserId(
        context
          .currentUser!.id,
      );
  }

  @Mutation(
    () =>
      AchievementEvaluationResultType,
  )
  @UseGuards(
    RequireAuthGuard,
  )
  reconcileMyAchievements(
    @Context()
    context:
      GraphQLAuthContext,
  ): Promise<
    AchievementEvaluationResultType
  > {
    return this
      .evaluator
      .evaluateUser(
        context
          .currentUser!.id,
      );
  }

  @Mutation(
    () =>
      AchievementProfileType,
  )
  @UseGuards(
    RequireAuthGuard,
  )
  async setAchievementShowcase(
    @Args(
      'achievementId',
      {
        type: () =>
          ID,
      },
    )
    achievementId: string,

    @Args(
      'position',
      {
        type: () =>
          Int,
        nullable: true,
      },
    )
    position:
      number | null,

    @Context()
    context:
      GraphQLAuthContext,
  ): Promise<
    AchievementProfileType
  > {
    try {
      return await this
        .achievementsService
        .setShowcase(
          context
            .currentUser!.id,

          achievementId,
          position,
        );
    } catch (error) {
      this.rethrowDomainError(
        error,
      );
    }
  }

  @Mutation(
    () =>
      AchievementProfileType,
  )
  @UseGuards(
    RequireAuthGuard,
  )
  async equipAchievementTitle(
    @Args(
      'achievementId',
      {
        type: () =>
          ID,
        nullable: true,
      },
    )
    achievementId:
      string | null,

    @Context()
    context:
      GraphQLAuthContext,
  ): Promise<
    AchievementProfileType
  > {
    try {
      return await this
        .achievementsService
        .equipTitle(
          context
            .currentUser!.id,

          achievementId,
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
        AchievementValidationError
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
