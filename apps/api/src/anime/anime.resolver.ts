import {
  Args,
  ID,
  Query,
  Resolver,
} from '@nestjs/graphql';

import {
  AnimeType,
} from './anime.graphql.js';

import {
  AnimeService,
} from './anime.service.js';

@Resolver(
  () => AnimeType,
)
export class AnimeResolver {
  constructor(
    private readonly animeService:
      AnimeService,
  ) {}

  @Query(
    () => AnimeType,
    {
      nullable: true,
    },
  )
  anime(
    @Args('id', {
      type: () => ID,
    })
    id: string,
  ): Promise<AnimeType | null> {
    return this.animeService
      .findById(id);
  }

  @Query(
    () => AnimeType,
    {
      nullable: true,
    },
  )
  animeBySlug(
    @Args('slug', {
      type: () => String,
    })
    slug: string,
  ): Promise<AnimeType | null> {
    return this.animeService
      .findBySlug(slug);
  }
}