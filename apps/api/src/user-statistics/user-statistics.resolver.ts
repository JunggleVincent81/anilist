import {
  Args,
  Query,
  Resolver,
} from '@nestjs/graphql';

import {
  UserStatisticsType,
} from './user-statistics.graphql.js';

import {
  UserStatisticsService,
} from './user-statistics.service.js';

@Resolver()
export class UserStatisticsResolver {
  constructor(
    private readonly userStatisticsService:
      UserStatisticsService,
  ) {}

  @Query(
    () => UserStatisticsType,
    {
      nullable: true,
    },
  )
  userStatistics(
    @Args(
      'username',
      {
        type: () =>
          String,
      },
    )
    username: string,
  ): Promise<
    UserStatisticsType | null
  > {
    return this
      .userStatisticsService
      .findPublic(
        username,
      );
  }
}
