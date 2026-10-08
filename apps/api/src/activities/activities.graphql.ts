import {
  Field,
  GraphQLISODateTime,
  ID,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';

import {
  ActivityType,
  ActivityVisibility,
  AnimeListStatus,
} from '@prisma/client';

registerEnumType(
  ActivityVisibility,
  {
    name:
      'ActivityVisibility',
  },
);

registerEnumType(
  ActivityType,
  {
    name:
      'ActivityType',
  },
);

@ObjectType()
class ActivitySettingsType {
  @Field(() => Boolean)
  autoActivityEnabled!: boolean;

  @Field(
    () =>
      ActivityVisibility,
  )
  activityVisibility!:
    ActivityVisibility;
}

@ObjectType()
class ActivityActorType {
  @Field()
  username!: string;

  @Field(
    () => String,
    {
      nullable: true,
    },
  )
  displayName!:
    string | null;

  @Field(
    () => String,
    {
      nullable: true,
    },
  )
  avatarUrl!:
    string | null;

  @Field()
  role!: string;
}

@ObjectType()
class ActivityAnimeType {
  @Field(() => ID)
  id!: string;

  @Field()
  slug!: string;

  @Field()
  title!: string;

  @Field(
    () => String,
    {
      nullable: true,
    },
  )
  coverImageUrl!:
    string | null;
}

@ObjectType()
class ActivityAchievementType {
  @Field(() => ID)
  id!: string;

  @Field()
  code!: string;

  @Field()
  name!: string;

  @Field()
  iconKey!: string;

  @Field(
    () => String,
    {
      nullable: true,
    },
  )
  titleReward!:
    string | null;
}

@ObjectType()
class ActivityItemType {
  @Field(() => ID)
  id!: string;

  @Field(
    () => ActivityType,
  )
  type!: ActivityType;

  @Field(
    () => String,
    {
      nullable: true,
    },
  )
  text!: string | null;

  @Field(
    () =>
      AnimeListStatus,
    {
      nullable: true,
    },
  )
  animeStatus!:
    AnimeListStatus | null;

  @Field(
    () => Int,
    {
      nullable: true,
    },
  )
  progressEpisodes!:
    number | null;

  @Field(
    () =>
      ActivityActorType,
  )
  actor!: ActivityActorType;

  @Field(
    () =>
      ActivityAnimeType,
    {
      nullable: true,
    },
  )
  anime!:
    ActivityAnimeType | null;

  @Field(
    () =>
      ActivityAchievementType,
    {
      nullable: true,
    },
  )
  achievement!:
    ActivityAchievementType | null;

  @Field(
    () =>
      GraphQLISODateTime,
  )
  createdAt!: Date;
}

@ObjectType()
class ActivityPageInfoType {
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

@ObjectType()
class ActivityPageType {
  @Field(
    () => [
      ActivityItemType,
    ],
  )
  items!:
    ActivityItemType[];

  @Field(
    () =>
      ActivityPageInfoType,
  )
  pageInfo!:
    ActivityPageInfoType;
}

export {
  ActivityAchievementType,
  ActivityActorType,
  ActivityAnimeType,
  ActivityItemType,
  ActivityPageInfoType,
  ActivityPageType,
  ActivitySettingsType,
};
