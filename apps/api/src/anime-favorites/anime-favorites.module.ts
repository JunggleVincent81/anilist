import {
  Module,
} from '@nestjs/common';

import {
  RequireAuthGuard,
} from '../auth/authorization/require-auth.guard.js';

import {
  DatabaseModule,
} from '../database/database.module.js';

import {
  AnimeFavoritesResolver,
} from './anime-favorites.resolver.js';

import {
  AnimeFavoritesService,
} from './anime-favorites.service.js';

@Module({
  imports: [
    DatabaseModule,
  ],

  providers: [
    AnimeFavoritesResolver,
    AnimeFavoritesService,
    RequireAuthGuard,
  ],

  exports: [
    AnimeFavoritesService,
  ],
})
export class AnimeFavoritesModule {}
