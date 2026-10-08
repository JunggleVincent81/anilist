import {
  Field,
  Int,
  ObjectType,
} from '@nestjs/graphql';

@ObjectType()
class UserFollowUserType {
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

  @Field(() => String)
  role!: string;
}

@ObjectType()
class UserFollowPageInfoType {
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
class UserFollowPageType {
  @Field()
  username!: string;

  @Field(
    () => [
      UserFollowUserType,
    ],
  )
  users!:
    UserFollowUserType[];

  @Field(
    () =>
      UserFollowPageInfoType,
  )
  pageInfo!:
    UserFollowPageInfoType;
}

@ObjectType()
class UserFollowSummaryType {
  @Field()
  username!: string;

  @Field(() => Int)
  followersCount!: number;

  @Field(() => Int)
  followingCount!: number;
}

@ObjectType()
class UserFollowStatusType {
  @Field()
  username!: string;

  @Field()
  isFollowing!: boolean;

  @Field()
  isSelf!: boolean;

  @Field(() => Int)
  followersCount!: number;

  @Field(() => Int)
  followingCount!: number;
}

export {
  UserFollowPageInfoType,
  UserFollowPageType,
  UserFollowStatusType,
  UserFollowSummaryType,
  UserFollowUserType,
};
