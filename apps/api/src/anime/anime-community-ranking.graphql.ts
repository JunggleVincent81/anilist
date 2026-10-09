import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('CommunityRankedAnime')
export class CommunityRankedAnimeType {
  @Field() slug!: string;
  @Field() title!: string;
  @Field(() => Float) averageScore!: number;
  @Field(() => Int) scoredReviewCount!: number;
}
