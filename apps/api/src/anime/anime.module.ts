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

import { AnimeCommunityRankingService } from './anime-community-ranking.service.js';
import { AnimeCommunityRankingResolver } from './anime-community-ranking.resolver.js';

@Module({
  imports: [
    DatabaseModule,
  ],

  providers: [
    AnimeService,
    AnimeResolver,

    AnimeDiscoveryService,
    AnimeDiscoveryResolver,
    AnimeCommunityRankingService,
    AnimeCommunityRankingResolver,
  ],

  exports: [
    AnimeService,
    AnimeDiscoveryService,
  ],
})
export class AnimeModule {}