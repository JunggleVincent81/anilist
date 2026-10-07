import {
  Field,
  GraphQLISODateTime,
  ID,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';

import {
  AnimeDataProvider,
  AnimeFormat,
  AnimeReleaseStatus,
  AnimeSeason,
  AnimeSourceMaterial,
  AnimeStudioRole,
  AnimeTitleType,
} from '@prisma/client';

enum AnimeRelationDisplayType {
  SEQUEL = 'SEQUEL',
  PREQUEL = 'PREQUEL',

  SIDE_STORY = 'SIDE_STORY',
  SPIN_OFF = 'SPIN_OFF',
  PARENT = 'PARENT',

  ALTERNATIVE = 'ALTERNATIVE',

  SUMMARY = 'SUMMARY',
  COMPILATION = 'COMPILATION',
  SOURCE = 'SOURCE',

  CONTAINS = 'CONTAINS',
  PART_OF = 'PART_OF',

  OTHER = 'OTHER',
}

registerEnumType(
  AnimeFormat,
  {
    name: 'AnimeFormat',
  },
);

registerEnumType(
  AnimeReleaseStatus,
  {
    name: 'AnimeReleaseStatus',
  },
);

registerEnumType(
  AnimeSeason,
  {
    name: 'AnimeSeason',
  },
);

registerEnumType(
  AnimeSourceMaterial,
  {
    name: 'AnimeSourceMaterial',
  },
);

registerEnumType(
  AnimeTitleType,
  {
    name: 'AnimeTitleType',
  },
);

registerEnumType(
  AnimeDataProvider,
  {
    name: 'AnimeDataProvider',
  },
);

registerEnumType(
  AnimeStudioRole,
  {
    name: 'AnimeStudioRole',
  },
);

registerEnumType(
  AnimeRelationDisplayType,
  {
    name: 'AnimeRelationDisplayType',
  },
);

@ObjectType('AnimeAlternateTitle')
class AnimeAlternateTitleType {
  @Field(() => ID)
  id!: string;

  @Field(() => AnimeTitleType)
  type!: AnimeTitleType;

  @Field(() => String)
  value!: string;

  @Field(() => String, {
    nullable: true,
  })
  languageCode!: string | null;
}

@ObjectType('AnimeExternalId')
class AnimeExternalIdType {
  @Field(() => AnimeDataProvider)
  provider!: AnimeDataProvider;

  @Field(() => String)
  externalId!: string;

  @Field(() => String, {
    nullable: true,
  })
  sourceUrl!: string | null;
}

@ObjectType('Genre')
class GenreType {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  slug!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String, {
    nullable: true,
  })
  description!: string | null;
}

@ObjectType('Tag')
class TagType {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  slug!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String, {
    nullable: true,
  })
  description!: string | null;
}

@ObjectType('Studio')
class StudioType {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  slug!: string;

  @Field(() => String)
  name!: string;
}

@ObjectType('AnimeStudioCredit')
class AnimeStudioCreditType {
  @Field(() => StudioType)
  studio!: StudioType;

  @Field(() => AnimeStudioRole)
  role!: AnimeStudioRole;

  @Field(() => Boolean)
  isMain!: boolean;
}

@ObjectType('AnimeSummary')
class AnimeSummaryType {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  slug!: string;

  @Field(() => String)
  title!: string;

  @Field(() => AnimeFormat)
  format!: AnimeFormat;

  @Field(() => AnimeReleaseStatus)
  status!: AnimeReleaseStatus;

  @Field(() => Int, {
    nullable: true,
  })
  episodes!: number | null;

  @Field(() => AnimeSeason, {
    nullable: true,
  })
  season!: AnimeSeason | null;

  @Field(() => Int, {
    nullable: true,
  })
  seasonYear!: number | null;

  @Field(() => String, {
    nullable: true,
  })
  coverImageUrl!: string | null;
}

@ObjectType('AnimeRelation')
class AnimeRelationType {
  @Field(
    () =>
      AnimeRelationDisplayType,
  )
  type!: AnimeRelationDisplayType;

  @Field(
    () =>
      AnimeSummaryType,
  )
  anime!: AnimeSummaryType;
}

@ObjectType('Anime')
class AnimeType {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  slug!: string;

  @Field(() => String)
  title!: string;

  @Field(() => String, {
    nullable: true,
  })
  titleRomaji!: string | null;

  @Field(() => String, {
    nullable: true,
  })
  titleEnglish!: string | null;

  @Field(() => String, {
    nullable: true,
  })
  titleNative!: string | null;

  @Field(() => String, {
    nullable: true,
  })
  description!: string | null;

  @Field(() => AnimeFormat)
  format!: AnimeFormat;

  @Field(
    () =>
      AnimeReleaseStatus,
  )
  status!: AnimeReleaseStatus;

  @Field(
    () =>
      AnimeSourceMaterial,
  )
  sourceMaterial!: AnimeSourceMaterial;

  @Field(() => Int, {
    nullable: true,
  })
  episodes!: number | null;

  @Field(() => Int, {
    nullable: true,
  })
  durationMinutes!: number | null;

  @Field(() => AnimeSeason, {
    nullable: true,
  })
  season!: AnimeSeason | null;

  @Field(() => Int, {
    nullable: true,
  })
  seasonYear!: number | null;

  @Field(
    () =>
      GraphQLISODateTime,
    {
      nullable: true,
    },
  )
  startDate!: Date | null;

  @Field(
    () =>
      GraphQLISODateTime,
    {
      nullable: true,
    },
  )
  endDate!: Date | null;

  @Field(() => String, {
    nullable: true,
  })
  coverImageUrl!: string | null;

  @Field(() => String, {
    nullable: true,
  })
  bannerImageUrl!: string | null;

  @Field(() => Boolean, {
    nullable: true,
  })
  isAdult!: boolean | null;

  @Field(
    () => [
      AnimeAlternateTitleType,
    ],
  )
  titles!: AnimeAlternateTitleType[];

  @Field(
    () => [
      AnimeExternalIdType,
    ],
  )
  externalIds!: AnimeExternalIdType[];

  @Field(() => [GenreType])
  genres!: GenreType[];

  @Field(() => [TagType])
  tags!: TagType[];

  @Field(
    () => [
      AnimeStudioCreditType,
    ],
  )
  studios!: AnimeStudioCreditType[];

  @Field(
    () => [
      AnimeRelationType,
    ],
  )
  relations!: AnimeRelationType[];

  @Field(
    () =>
      GraphQLISODateTime,
  )
  createdAt!: Date;

  @Field(
    () =>
      GraphQLISODateTime,
  )
  updatedAt!: Date;
}

export {
  AnimeAlternateTitleType,
  AnimeExternalIdType,
  AnimeRelationDisplayType,
  AnimeRelationType,
  AnimeStudioCreditType,
  AnimeSummaryType,
  AnimeType,
  GenreType,
  StudioType,
  TagType,
};