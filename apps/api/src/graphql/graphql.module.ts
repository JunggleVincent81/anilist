import {
  ApolloDriver,
  ApolloDriverConfig,
} from '@nestjs/apollo';
import {
  Module,
} from '@nestjs/common';
import {
  GraphQLModule,
} from '@nestjs/graphql';
import type {
  Request,
  Response,
} from 'express';

import {
  AuthContextService,
} from '../auth/auth-context.service.js';
import {
  AuthModule,
} from '../auth/auth.module.js';
import {
  loadEnvironment,
} from '../config/environment.js';
import { graphqlQuerySafetyRule } from './graphql-query-safety.rule.js';

@Module({
  imports: [
    GraphQLModule
      .forRootAsync<
        ApolloDriverConfig
      >({
        driver: ApolloDriver,

        imports: [
          AuthModule,
        ],

        inject: [
          AuthContextService,
        ],

        useFactory: (
          authContextService:
            AuthContextService,
        ) => {
          const environment =
            loadEnvironment();

          const isProduction =
            environment.nodeEnv ===
            'production';

          return {
            autoSchemaFile: true,
            sortSchema: true,

            csrfPrevention: true,
            validationRules: [graphqlQuerySafetyRule],

            introspection:
              !isProduction,

            includeStacktraceInErrorResponses:
              !isProduction,

            context: async ({
              req,
              res,
            }: {
              req: Request;
              res: Response;
            }) =>
              authContextService
                .createContext(
                  req,
                  res,
                ),
          };
        },
      }),
  ],
})
export class GraphqlModule {}