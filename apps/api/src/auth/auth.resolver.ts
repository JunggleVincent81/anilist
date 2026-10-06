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
import { GraphQLError } from 'graphql';

import {
  AccountIdentityConflictError,
  InvalidCredentialsError,
} from './auth.errors.js';
import { AuthService } from './auth.service.js';
import {
  RequireAuthGuard,
} from './authorization/require-auth.guard.js';
import type {
  GraphQLAuthContext,
} from './auth.types.js';
import {
  LoginInput,
} from './dto/login.input.js';
import {
  RegisterInput,
} from './dto/register.input.js';
import {
  AuthPayloadType,
} from './models/auth-payload.type.js';
import {
  AuthUserType,
} from './models/auth-user.type.js';
import {
  getSessionCookieClearOptions,
  getSessionCookieName,
  getSessionCookieOptions,
} from './security/session-cookie.security.js';

@Resolver()
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Query(() => AuthUserType)
  @UseGuards(RequireAuthGuard)
  me(
    @Context()
    context: GraphQLAuthContext,
  ): AuthUserType {
    return context.currentUser!;
  }

  @Mutation(() => AuthPayloadType)
  async register(
    @Args('input')
    input: RegisterInput,

    @Context()
    context: GraphQLAuthContext,
  ): Promise<AuthPayloadType> {
    try {
      const result =
        await this.authService.register(
          input,
        );

      this.setSessionCookie(
        context,
        result.sessionToken,
      );

      return {
        user: result.user,
      };
    } catch (error) {
      if (
        error instanceof
        AccountIdentityConflictError
      ) {
        throw new GraphQLError(
          error.message,
          {
            extensions: {
              code: 'BAD_USER_INPUT',
            },
          },
        );
      }

      throw error;
    }
  }

  @Mutation(() => AuthPayloadType)
  async login(
    @Args('input')
    input: LoginInput,

    @Context()
    context: GraphQLAuthContext,
  ): Promise<AuthPayloadType> {
    try {
      const result =
        await this.authService.login(
          input,
        );

      this.setSessionCookie(
        context,
        result.sessionToken,
      );

      return {
        user: result.user,
      };
    } catch (error) {
      if (
        error instanceof
        InvalidCredentialsError
      ) {
        throw new GraphQLError(
          error.message,
          {
            extensions: {
              code: 'UNAUTHENTICATED',
            },
          },
        );
      }

      throw error;
    }
  }

  @Mutation(() => Boolean)
  async logout(
    @Context()
    context: GraphQLAuthContext,
  ): Promise<boolean> {
    await this.authService.revokeSession(
      context.currentSession?.id ?? null,
    );

    context.res.clearCookie(
      getSessionCookieName(),
      getSessionCookieClearOptions(),
    );

    return true;
  }

  private setSessionCookie(
    context: GraphQLAuthContext,
    sessionToken: string,
  ): void {
    context.res.cookie(
      getSessionCookieName(),
      sessionToken,
      getSessionCookieOptions(),
    );
  }
}