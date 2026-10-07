import {
  Module,
} from '@nestjs/common';

import {
  DatabaseModule,
} from '../database/database.module.js';

import {
  AnimeDiscoveryResolver,
} from './anime-discovery.resolver.js';

import {
  AnimeDiscoveryService,
} from './anime-discovery.service.js';

import {
  AnimeResolver,
} from './anime.resolver.js';

import {
  AnimeService,
} from './anime.service.js';

@Module({
  imports: [
    DatabaseModule,
  ],

  providers: [
    AnimeService,
    AnimeResolver,

    AnimeDiscoveryService,
    AnimeDiscoveryResolver,
  ],

  exports: [
    AnimeService,
    AnimeDiscoveryService,
  ],
})
export class AnimeModule {}