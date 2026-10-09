import { Field, ID, InputType, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { AnimeCatalogStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

// A private GraphQL enum name avoids depending on public catalog schema registration.
registerEnumType(AnimeCatalogStatus, { name: 'AdminCatalogCurationStatus' });

export enum AdminCatalogAgeFilter {
  UNKNOWN = 'UNKNOWN',
  ADULT = 'ADULT',
  NON_ADULT = 'NON_ADULT',
}
registerEnumType(AdminCatalogAgeFilter, { name: 'AdminCatalogAgeFilter' });

@InputType()
export class AdminCatalogPageInput {
  @Field(() => Int, { nullable: true })
  @IsOptional() @IsInt() @Min(1) @Max(100_000)
  page?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional() @IsInt() @Min(1) @Max(100)
  perPage?: number;

  @Field(() => String, { nullable: true })
  @IsOptional() @IsString() @MaxLength(120)
  search?: string;

  @Field(() => AnimeCatalogStatus, { nullable: true })
  @IsOptional() @IsEnum(AnimeCatalogStatus)
  status?: AnimeCatalogStatus;

  @Field(() => AdminCatalogAgeFilter, { nullable: true })
  @IsOptional() @IsEnum(AdminCatalogAgeFilter)
  age?: AdminCatalogAgeFilter;
}

@ObjectType()
export class AdminCatalogOverviewType {
  @Field(() => Int) total!: number;
  @Field(() => Int) included!: number;
  @Field(() => Int) review!: number;
  @Field(() => Int) excluded!: number;
  @Field(() => Int) unverifiedAge!: number;
  @Field(() => Int) emptySynopsis!: number;
  @Field(() => Int) missingCover!: number;
  @Field(() => Int) curationRequests!: number;
}

@ObjectType()
export class AdminCatalogAnimeType {
  @Field(() => ID) id!: string;
  @Field() slug!: string;
  @Field() title!: string;
  @Field(() => String) format!: string;
  @Field(() => AnimeCatalogStatus) catalogStatus!: AnimeCatalogStatus;
  @Field(() => Int, { nullable: true }) seasonYear!: number | null;
  @Field(() => Boolean, { nullable: true }) isAdult!: boolean | null;
  @Field() hasSynopsis!: boolean;
  @Field() hasCover!: boolean;
  @Field(() => String, { nullable: true }) synopsisPreview!: string | null;
}

@ObjectType()
export class AdminCatalogPageInfoType {
  @Field(() => Int) page!: number;
  @Field(() => Int) perPage!: number;
  @Field(() => Int) total!: number;
  @Field(() => Int) pageCount!: number;
  @Field() hasNextPage!: boolean;
  @Field() hasPreviousPage!: boolean;
}

@ObjectType()
export class AdminCatalogPageType {
  @Field(() => [AdminCatalogAnimeType]) items!: AdminCatalogAnimeType[];
  @Field(() => AdminCatalogPageInfoType) pageInfo!: AdminCatalogPageInfoType;
}
