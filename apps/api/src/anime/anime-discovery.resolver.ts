import {
  Args,
  Query,
  Resolver,
} from '@nestjs/graphql';

import {
  AnimeDiscoveryInput,
  AnimeDiscoveryResultType,
} from './anime-discovery.graphql.js';

import {
  AnimeDiscoveryService,
} from './anime-discovery.service.js';

@Resolver()
export class AnimeDiscoveryResolver {
  constructor(
    private readonly discoveryService:
      AnimeDiscoveryService,
  ) {}

  @Query(
    () =>
      AnimeDiscoveryResultType,
  )
  animeDiscovery(
    @Args(
      'input',
      {
        type:
          () =>
            AnimeDiscoveryInput,

        nullable: true,
      },
    )
    input?:
      AnimeDiscoveryInput,
  ): Promise<AnimeDiscoveryResultType> {
    return this.discoveryService
      .discover(input);
  }
}