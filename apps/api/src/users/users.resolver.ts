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
  AuthUserType,
} from '../auth/models/auth-user.type.js';
import {
  RequireAuthGuard,
} from '../auth/authorization/require-auth.guard.js';
import type {
  GraphQLAuthContext,
} from '../auth/auth.types.js';

import {
  UpdateProfileInput,
} from './dto/update-profile.input.js';
import {
  UserProfileType,
} from './models/user-profile.type.js';
import {
  UsersService,
} from './users.service.js';

@Resolver()
export class UsersResolver {
  constructor(
    private readonly usersService:
      UsersService,
  ) {}

  @Query(
    () => UserProfileType,
    {
      nullable: true,
    },
  )
  userProfile(
    @Args('username', {
      type: () => String,
    })
    username: string,
  ): Promise<UserProfileType | null> {
    return this.usersService
      .findPublicProfile(
        username,
      );
  }

  @Mutation(() => AuthUserType)
  @UseGuards(RequireAuthGuard)
  updateProfile(
    @Args('input')
    input: UpdateProfileInput,

    @Context()
    context: GraphQLAuthContext,
  ): Promise<AuthUserType> {
    return this.usersService
      .updateProfile(
        context.currentUser!.id,
        input,
      );
  }
}