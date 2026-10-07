import {
  Field,
  InputType,
  Int,
} from '@nestjs/graphql';

import {
  AnimeListStatus,
} from '@prisma/client';

import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

@InputType()
class AnimeListQueryInput {
  @Field(() => String)
  @IsString()
  @Matches(
    /^[a-zA-Z0-9_]{3,24}$/,
  )
  username!: string;

  @Field(
    () => AnimeListStatus,
    {
      nullable: true,
    },
  )
  @IsOptional()
  @IsEnum(
    AnimeListStatus,
  )
  status?: AnimeListStatus;

  @Field(
    () => Int,
    {
      nullable: true,
      defaultValue: 1,
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
      defaultValue: 50,
    },
  )
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  perPage?: number;
}

export {
  AnimeListQueryInput,
};
