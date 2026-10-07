import {
  Field,
  Float,
  ID,
  Int,
  ObjectType,
} from '@nestjs/graphql';

@ObjectType()
class UserGenreStatisticType {
  @Field(() => ID)
  id!: string;

  @Field()
  slug!: string;

  @Field()
  name!: string;

  @Field(() => Int)
  count!: number;
}

@ObjectType()
class UserStatisticsType {
  @Field()
  username!: string;

  @Field(() => Int)
  totalTracked!: number;

  @Field(() => Int)
  planning!: number;

  @Field(() => Int)
  watching!: number;

  @Field(() => Int)
  completed!: number;

  @Field(() => Int)
  paused!: number;

  @Field(() => Int)
  dropped!: number;

  @Field(() => Int)
  rewatching!: number;

  @Field(() => Int)
  episodesLogged!: number;

  @Field(() => Int)
  totalRewatches!: number;

  @Field(() => Int)
  scoredAnime!: number;

  @Field(
    () => Float,
    {
      nullable: true,
    },
  )
  meanScore!: number | null;

  @Field(() => Int)
  favoriteAnimeCount!: number;

  @Field(
    () => [
      UserGenreStatisticType,
    ],
  )
  topGenres!:
    UserGenreStatisticType[];
}

export {
  UserGenreStatisticType,
  UserStatisticsType,
};
