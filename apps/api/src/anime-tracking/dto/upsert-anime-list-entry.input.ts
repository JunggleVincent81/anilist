import {
  Field,
  Float,
  ID,
  InputType,
  Int,
} from '@nestjs/graphql';

import {
  AnimeListStatus,
} from '@prisma/client';

import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

@InputType()
class UpsertAnimeListEntryInput {
  @Field(() => ID)
  @IsUUID()
  animeId!: string;

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
    },
  )
  @IsOptional()
  @IsInt()
  @Min(0)
  progressEpisodes?: number;

  @Field(
    () => Float,
    {
      nullable: true,
    },
  )
  @IsOptional()
  @IsNumber({
    maxDecimalPlaces: 1,
  })
  @Min(1)
  @Max(10)
  score?: number | null;
}

export {
  UpsertAnimeListEntryInput,
};
