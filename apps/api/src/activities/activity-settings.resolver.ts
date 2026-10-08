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
  RequireAuthGuard,
} from '../auth/authorization/require-auth.guard.js';

import type {
  GraphQLAuthContext,
} from '../auth/auth.types.js';

import {
  ActivitySettingsType,
} from './activities.graphql.js';

import {
  ActivitySettingsService,
} from './activity-settings.service.js';

import {
  UpdateActivitySettingsInput,
} from './dto/update-activity-settings.input.js';

@Resolver()
class ActivitySettingsResolver {
  constructor(
    private readonly activitySettingsService:
      ActivitySettingsService,
  ) {}

  @Query(
    () =>
      ActivitySettingsType,
  )
  @UseGuards(
    RequireAuthGuard,
  )
  myActivitySettings(
    @Context()
    context:
      GraphQLAuthContext,
  ): Promise<
    ActivitySettingsType
  > {
    return this
      .activitySettingsService
      .findMine(
        context
          .currentUser!.id,
      );
  }

  @Mutation(
    () =>
      ActivitySettingsType,
  )
  @UseGuards(
    RequireAuthGuard,
  )
  updateMyActivitySettings(
    @Args('input')
    input:
      UpdateActivitySettingsInput,

    @Context()
    context:
      GraphQLAuthContext,
  ): Promise<
    ActivitySettingsType
  > {
    return this
      .activitySettingsService
      .updateMine(
        context
          .currentUser!.id,

        input,
      );
  }
}

export {
  ActivitySettingsResolver,
};
