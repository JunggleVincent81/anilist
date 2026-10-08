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
  AchievementCategory,
  AchievementMetric,
} from '@prisma/client';

registerEnumType(
  AchievementCategory,
  {
    name:
      'AchievementCategory',
  },
);

registerEnumType(
  AchievementMetric,
  {
    name:
      'AchievementMetric',
  },
);

@ObjectType(
  'AchievementItem',
)
class AchievementItemType {
  @Field(() => ID)
  id!: string;

  @Field()
  code!: string;

  @Field()
  name!: string;

  @Field()
  description!: string;

  @Field(
    () =>
      AchievementCategory,
  )
  category!:
    AchievementCategory;

  @Field(
    () =>
      AchievementMetric,
  )
  metric!:
    AchievementMetric;

  @Field(() => Int)
  threshold!: number;

  @Field(
    () => String,
    {
      nullable: true,
    },
  )
  targetKey!:
    string | null;

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

  @Field(() => Int)
  progress!: number;

  @Field(() => Float)
  progressPercent!: number;

  @Field()
  unlocked!: boolean;

  @Field(
    () =>
      GraphQLISODateTime,
    {
      nullable: true,
    },
  )
  unlockedAt!:
    Date | null;

  @Field(
    () => Int,
    {
      nullable: true,
    },
  )
  showcasePosition!:
    number | null;

  @Field()
  canEquipTitle!: boolean;
}

@ObjectType(
  'AchievementTitle',
)
class AchievementTitleType {
  @Field(() => ID)
  achievementId!: string;

  @Field()
  code!: string;

  @Field()
  title!: string;
}

@ObjectType(
  'AchievementProfile',
)
class AchievementProfileType {
  @Field()
  username!: string;

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  unlockedCount!: number;

  @Field(
    () =>
      AchievementTitleType,
    {
      nullable: true,
    },
  )
  equippedTitle!:
    AchievementTitleType | null;

  @Field(
    () => [
      AchievementItemType,
    ],
  )
  showcase!:
    AchievementItemType[];

  @Field(
    () => [
      AchievementItemType,
    ],
  )
  items!:
    AchievementItemType[];
}

@ObjectType(
  'AchievementEvaluationResult',
)
class AchievementEvaluationResultType {
  @Field(() => Int)
  evaluatedAchievements!:
    number;

  @Field(() => Int)
  newlyUnlocked!: number;

  @Field(() => Int)
  totalUnlocked!: number;
}

export {
  AchievementEvaluationResultType,
  AchievementItemType,
  AchievementProfileType,
  AchievementTitleType,
};
