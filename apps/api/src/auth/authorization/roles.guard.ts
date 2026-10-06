import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import {
  GqlExecutionContext,
} from '@nestjs/graphql';
import {
  Reflector,
} from '@nestjs/core';
import type {
  UserRole,
} from '@prisma/client';
import { GraphQLError } from 'graphql';

import type {
  GraphQLAuthContext,
} from '../auth.types.js';
import {
  ROLES_KEY,
} from './roles.decorator.js';

@Injectable()
export class RolesGuard
  implements CanActivate
{
  constructor(
    private readonly reflector: Reflector,
  ) {}

  canActivate(
    executionContext: ExecutionContext,
  ): boolean {
    const requiredRoles =
      this.reflector
        .getAllAndOverride<
          UserRole[]
        >(
          ROLES_KEY,
          [
            executionContext.getHandler(),
            executionContext.getClass(),
          ],
        );

    if (
      !requiredRoles ||
      requiredRoles.length === 0
    ) {
      return true;
    }

    const gqlContext =
      GqlExecutionContext.create(
        executionContext,
      );

    const context =
      gqlContext.getContext<
        GraphQLAuthContext
      >();

    if (!context.currentUser) {
      throw new GraphQLError(
        'Authentication required.',
        {
          extensions: {
            code: 'UNAUTHENTICATED',
          },
        },
      );
    }

    if (
      !requiredRoles.includes(
        context.currentUser.role,
      )
    ) {
      throw new GraphQLError(
        'You do not have permission to perform this action.',
        {
          extensions: {
            code: 'FORBIDDEN',
          },
        },
      );
    }

    return true;
  }
}