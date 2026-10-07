import {
  Field,
  GraphQLISODateTime,
  ID,
  Int,
  ObjectType,
} from '@nestjs/graphql';

import {
  AnimeFormat,
  AnimeReleaseStatus,
  AnimeSeason,
} from '@prisma/client';

@ObjectType(
  'AiringScheduleAnime',
)
class AiringScheduleAnimeType {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  slug!: string;

  @Field(() => String)
  title!: string;

  @Field(
    () => AnimeFormat,
  )
  format!: AnimeFormat;

  @Field(
    () => AnimeReleaseStatus,
  )
  status!: AnimeReleaseStatus;

  @Field(
    () => Int,
    {
      nullable: true,
    },
  )
  episodes!: number | null;

  @Field(
    () => AnimeSeason,
    {
      nullable: true,
    },
  )
  season!: AnimeSeason | null;

  @Field(
    () => Int,
    {
      nullable: true,
    },
  )
  seasonYear!: number | null;

  @Field(
    () => String,
    {
      nullable: true,
    },
  )
  coverImageUrl!: string | null;
}

@ObjectType(
  'AiringScheduleItem',
)
class AiringScheduleItemType {
  @Field(
    () => GraphQLISODateTime,
  )
  airingAt!: Date;

  @Field(() => Int)
  episode!: number;

  @Field(
    () => AiringScheduleAnimeType,
  )
  anime!:
    AiringScheduleAnimeType;
}

@ObjectType(
  'AiringScheduleResult',
)
class AiringScheduleResultType {
  @Field(
    () => GraphQLISODateTime,
  )
  generatedAt!: Date;

  @Field(
    () => GraphQLISODateTime,
  )
  rangeStart!: Date;

  @Field(
    () => GraphQLISODateTime,
  )
  rangeEnd!: Date;

  @Field(
    () => [
      AiringScheduleItemType,
    ],
  )
  items!:
    AiringScheduleItemType[];
}

export {
  AiringScheduleAnimeType,
  AiringScheduleItemType,
  AiringScheduleResultType,
};
