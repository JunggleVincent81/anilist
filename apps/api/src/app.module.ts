import {
  Module,
} from '@nestjs/common';

import {
  AnimeModule,
} from './anime/anime.module.js';

import {
  AuthModule,
} from './auth/auth.module.js';

import {
  DatabaseModule,
} from './database/database.module.js';

import {
  GraphqlModule,
} from './graphql/graphql.module.js';

import {
  HealthModule,
} from './health/health.module.js';

import {
  UsersModule,
} from './users/users.module.js';

@Module({
  imports: [
    DatabaseModule,

    AuthModule,
    UsersModule,
    AnimeModule,

    GraphqlModule,
    HealthModule,
  ],
})
export class AppModule {}