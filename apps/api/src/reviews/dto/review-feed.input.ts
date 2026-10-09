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
class ReviewFeedInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  perPage?: number;
}

export { ReviewFeedInput };
