import { Query, Resolver } from '@nestjs/graphql';
import { CommunityRankedAnimeType } from './anime-community-ranking.graphql.js';
import { AnimeCommunityRankingService } from './anime-community-ranking.service.js';

@Resolver()
export class AnimeCommunityRankingResolver {
  constructor(private readonly ranking: AnimeCommunityRankingService) {}
  @Query(() => [CommunityRankedAnimeType])
  communityRankedAnime(): Promise<CommunityRankedAnimeType[]> {
    return this.ranking.topRated();
  }
}
