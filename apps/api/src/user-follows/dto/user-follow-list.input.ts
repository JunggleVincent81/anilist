import {
  Field,
  InputType,
  Int,
} from '@nestjs/graphql';

import {
  IsInt,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

@InputType()
class UserFollowListInput {
  @Field()
  @IsString()
  @Matches(
    /^[a-zA-Z0-9_]{3,24}$/,
  )
  username!: string;

  @Field(
    () => Int,
    {
      defaultValue: 1,
    },
  )
  @IsInt()
  @Min(1)
  page = 1;

  @Field(
    () => Int,
    {
      defaultValue: 20,
    },
  )
  @IsInt()
  @Min(1)
  @Max(50)
  perPage = 20;
}

export {
  UserFollowListInput,
};
