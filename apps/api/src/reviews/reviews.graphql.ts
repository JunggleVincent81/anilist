import {
  Field,
  Float,
  GraphQLISODateTime,
  ID,
  Int,
  ObjectType,
} from '@nestjs/graphql';

@ObjectType('AnimeReviewAuthor')
class AnimeReviewAuthorType {
  @Field(() => ID)
  id!: string;

  @Field()
  username!: string;

  @Field(() => String, { nullable: true })
  displayName!: string | null;

  @Field(() => String, { nullable: true })
  avatarUrl!: string | null;
}

@ObjectType('AnimeReviewAnime')
class AnimeReviewAnimeType {
  @Field(() => ID)
  id!: string;

  @Field()
  slug!: string;

  @Field()
  title!: string;

  @Field(() => String, { nullable: true })
  coverImageUrl!: string | null;
}

@ObjectType('AnimeReview')
class AnimeReviewType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  userId!: string;

  @Field(() => ID)
  animeId!: string;

  @Field(() => String, { nullable: true })
  title!: string | null;

  @Field()
  body!: string;

  @Field(() => Float, { nullable: true })
  score!: number | null;

  @Field()
  isSpoiler!: boolean;

  @Field(() => AnimeReviewAuthorType)
  author!: AnimeReviewAuthorType;

  @Field(() => AnimeReviewAnimeType)
  anime!: AnimeReviewAnimeType;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;
}

@ObjectType('AnimeReviewPageInfo')
class AnimeReviewPageInfoType {
  @Field(() => Int)
  page!: number;

  @Field(() => Int)
  perPage!: number;

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  pageCount!: number;

  @Field()
  hasNextPage!: boolean;

  @Field()
  hasPreviousPage!: boolean;
}

@ObjectType('AnimeReviewStats')
class AnimeReviewStatsType {
  @Field(() => ID)
  animeId!: string;

  @Field(() => Int)
  totalReviews!: number;

  @Field(() => Int)
  scoredReviews!: number;

  @Field(() => Float, { nullable: true })
  averageScore!: number | null;
}

@ObjectType('AnimeReviewPage')
class AnimeReviewPageType {
  @Field(() => [AnimeReviewType])
  items!: AnimeReviewType[];

  @Field(() => AnimeReviewPageInfoType)
  pageInfo!: AnimeReviewPageInfoType;
}

export {
  AnimeReviewType,
  AnimeReviewPageType,
  AnimeReviewStatsType,
};
