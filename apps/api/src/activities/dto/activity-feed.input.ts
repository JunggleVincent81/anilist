import {
  Field,
  InputType,
  Int,
} from '@nestjs/graphql';

import {
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

@InputType()
class ActivityFeedInput {
  @Field(
    () => Int,
    {
      nullable: true,
    },
  )
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @Field(
    () => Int,
    {
      nullable: true,
    },
  )
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  perPage?: number;
}

export {
  ActivityFeedInput,
};
