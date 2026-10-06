import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import {
  GqlExecutionContext,
} from '@nestjs/graphql';
import { GraphQLError } from 'graphql';

import type {
  GraphQLAuthContext,
} from '../auth.types.js';

@Injectable()
export class RequireAuthGuard
  implements CanActivate
{
  canActivate(
    executionContext: ExecutionContext,
  ): boolean {
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

    return true;
  }
}