import {
  Args,
  Int,
  Query,
  Resolver,
} from '@nestjs/graphql';

import {
  GraphQLError,
} from 'graphql';

import {
  AiringScheduleResultType,
} from './airing-schedule.graphql.js';

import {
  AiringScheduleService,
} from './airing-schedule.service.js';

import {
  AiringScheduleUpstreamError,
  AiringScheduleValidationError,
} from './airing-schedule.errors.js';

@Resolver()
export class AiringScheduleResolver {
  constructor(
    private readonly airingScheduleService:
      AiringScheduleService,
  ) {}

  @Query(
    () =>
      AiringScheduleResultType,
  )
  async airingSchedule(
    @Args(
      'days',
      {
        type:
          () => Int,

        nullable: true,

        defaultValue:
          7,
      },
    )
    days: number,
  ): Promise<
    AiringScheduleResultType
  > {
    try {
      return await this
        .airingScheduleService
        .findUpcoming(
          days,
        );
    } catch (error) {
      if (
        error instanceof
          AiringScheduleValidationError
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
          AiringScheduleUpstreamError
      ) {
        throw new GraphQLError(
          'Airing schedule is temporarily unavailable.',
          {
            extensions: {
              code:
                'UPSTREAM_UNAVAILABLE',
            },
          },
        );
      }

      throw error;
    }
  }
}
