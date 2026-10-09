import { Query, Resolver } from '@nestjs/graphql';
import { PublicMangaWork, PublicAnimeMusicTrack } from './manga-music.graphql.js';
import { MangaMusicService } from './manga-music.service.js';

@Resolver()
export class MangaMusicResolver {
  constructor(private readonly catalog: MangaMusicService) {}

  @Query(() => [PublicMangaWork])
  publicMangaPreview(): Promise<PublicMangaWork[]> {
    return this.catalog.manga();
  }

  @Query(() => [PublicAnimeMusicTrack])
  publicAnimeMusicPreview(): Promise<PublicAnimeMusicTrack[]> {
    return this.catalog.music();
  }
}
