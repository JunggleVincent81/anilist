import {
  Field,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';

import {
  Transform,
} from 'class-transformer';

import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import {
  AnimeFormat,
  AnimeReleaseStatus,
  AnimeSeason,
} from '@prisma/client';

import {
  AnimeSummaryType,
} from './anime.graphql.js';

enum AnimeDiscoverySort {
  TITLE_ASC = 'TITLE_ASC',
  TITLE_DESC = 'TITLE_DESC',

  START_DATE_ASC = 'START_DATE_ASC',
  START_DATE_DESC = 'START_DATE_DESC',

  SEASON_YEAR_ASC = 'SEASON_YEAR_ASC',
  SEASON_YEAR_DESC = 'SEASON_YEAR_DESC',
}

registerEnumType(
  AnimeDiscoverySort,
  {
    name:
      'AnimeDiscoverySort',
  },
);

function normalizeOptionalSearch(
  value: unknown,
): unknown {
  if (
    typeof value !==
    'string'
  ) {
    return value;
  }

  const normalized =
    value
      .trim()
      .replace(
        /\s+/g,
        ' ',
      );

  return normalized.length > 0
    ? normalized
    : undefined;
}

function normalizeSlugArray(
  value: unknown,
): unknown {
  if (
    !Array.isArray(value)
  ) {
    return value;
  }

  const normalized =
    value
      .filter(
        (
          item,
        ): item is string =>
          typeof item ===
          'string',
      )
      .map(
        (item) =>
          item
            .trim()
            .toLowerCase(),
      )
      .filter(
        (item) =>
          item.length > 0,
      );

  return [
    ...new Set(
      normalized,
    ),
  ];
}

@InputType(
  'AnimeDiscoveryInput',
)
class AnimeDiscoveryInput {
  @Field(() => Int, {
    defaultValue: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @Field(() => Int, {
    defaultValue: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  perPage?: number;

  @Field(
    () =>
      AnimeDiscoverySort,
    {
      defaultValue:
        AnimeDiscoverySort
          .TITLE_ASC,
    },
  )
  @IsOptional()
  @IsEnum(
    AnimeDiscoverySort,
  )
  sort?:
    AnimeDiscoverySort;

  @Field(() => String, {
    nullable: true,
  })
  @Transform(
    ({ value }) =>
      normalizeOptionalSearch(
        value,
      ),
  )
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @Field(
    () => [
      AnimeFormat,
    ],
    {
      nullable: true,
    },
  )
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsEnum(
    AnimeFormat,
    {
      each: true,
    },
  )
  formats?:
    AnimeFormat[];

  @Field(
    () => [
      AnimeReleaseStatus,
    ],
    {
      nullable: true,
    },
  )
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsEnum(
    AnimeReleaseStatus,
    {
      each: true,
    },
  )
  statuses?:
    AnimeReleaseStatus[];

  @Field(
    () => [
      AnimeSeason,
    ],
    {
      nullable: true,
    },
  )
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @IsEnum(
    AnimeSeason,
    {
      each: true,
    },
  )
  seasons?:
    AnimeSeason[];

  @Field(() => Int, {
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2200)
  seasonYear?: number;

  @Field(
    () => [String],
    {
      nullable: true,
    },
  )
  @Transform(
    ({ value }) =>
      normalizeSlugArray(
        value,
      ),
  )
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({
    each: true,
  })
  @Matches(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    {
      each: true,
    },
  )
  genreSlugs?:
    string[];

  @Field(
    () => [String],
    {
      nullable: true,
    },
  )
  @Transform(
    ({ value }) =>
      normalizeSlugArray(
        value,
      ),
  )
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({
    each: true,
  })
  @Matches(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    {
      each: true,
    },
  )
  tagSlugs?:
    string[];

  @Field(
    () => [String],
    {
      nullable: true,
    },
  )
  @Transform(
    ({ value }) =>
      normalizeSlugArray(
        value,
      ),
  )
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({
    each: true,
  })
  @Matches(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    {
      each: true,
    },
  )
  studioSlugs?:
    string[];
}

@ObjectType(
  'AnimePageInfo',
)
class AnimePageInfoType {
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

@ObjectType(
  'AnimeDiscoveryResult',
)
class AnimeDiscoveryResultType {
  @Field(
    () => [
      AnimeSummaryType,
    ],
  )
  items!: AnimeSummaryType[];

  @Field(
    () =>
      AnimePageInfoType,
  )
  pageInfo!: AnimePageInfoType;
}

export {
  AnimeDiscoveryInput,
  AnimeDiscoveryResultType,
  AnimeDiscoverySort,
  AnimePageInfoType,
};