import {
  Field,
  GraphQLISODateTime,
  ID,
  ObjectType,
} from '@nestjs/graphql';

import {
  AnimeSummaryType,
} from '../anime/anime.graphql.js';

@ObjectType()
class AnimeFavoriteType {
  @Field(() => ID)
  id!: string;

  @Field(
    () => AnimeSummaryType,
  )
  anime!: AnimeSummaryType;

  @Field(
    () =>
      GraphQLISODateTime,
  )
  createdAt!: Date;
}

@ObjectType()
class AnimeFavoritesType {
  @Field()
  username!: string;

  @Field(
    () => [
      AnimeFavoriteType,
    ],
  )
  items!: AnimeFavoriteType[];
}

export {
  AnimeFavoriteType,
  AnimeFavoritesType,
};
