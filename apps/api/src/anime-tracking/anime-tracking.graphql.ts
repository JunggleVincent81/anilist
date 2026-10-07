import {
  Field,
  Float,
  GraphQLISODateTime,
  ID,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';

import {
  AnimeListStatus,
} from '@prisma/client';

import {
  AnimeSummaryType,
} from '../anime/anime.graphql.js';

registerEnumType(
  AnimeListStatus,
  {
    name: 'AnimeListStatus',
  },
);

@ObjectType('AnimeListEntry')
class AnimeListEntryType {
  @Field(() => ID)
  id!: string;

  @Field(() => AnimeListStatus)
  status!: AnimeListStatus;

  @Field(() => Int)
  progressEpisodes!: number;

  @Field(() => Float, {
    nullable: true,
  })
  score!: number | null;

  @Field(() => Int)
  rewatchCount!: number;

  @Field(
    () => GraphQLISODateTime,
    {
      nullable: true,
    },
  )
  startedAt!: Date | null;

  @Field(
    () => GraphQLISODateTime,
    {
      nullable: true,
    },
  )
  completedAt!: Date | null;

  @Field(() => AnimeSummaryType)
  anime!: AnimeSummaryType;

  @Field(
    () => GraphQLISODateTime,
  )
  createdAt!: Date;

  @Field(
    () => GraphQLISODateTime,
  )
  updatedAt!: Date;
}

@ObjectType('AnimeListPageInfo')
class AnimeListPageInfoType {
  @Field(() => Int)
  page!: number;

  @Field(() => Int)
  perPage!: number;

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  pageCount!: number;

  @Field(() => Boolean)
  hasNextPage!: boolean;

  @Field(() => Boolean)
  hasPreviousPage!: boolean;
}

@ObjectType('AnimeListPage')
class AnimeListPageType {
  @Field(() => String)
  username!: string;

  @Field(
    () => [
      AnimeListEntryType,
    ],
  )
  entries!: AnimeListEntryType[];

  @Field(
    () => AnimeListPageInfoType,
  )
  pageInfo!: AnimeListPageInfoType;
}

export {
  AnimeListEntryType,
  AnimeListPageInfoType,
  AnimeListPageType,
};
