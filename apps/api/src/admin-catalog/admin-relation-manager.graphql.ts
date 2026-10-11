import { Field, ID, InputType, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { CatalogRelationKind } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

registerEnumType(CatalogRelationKind, { name: 'AdminCatalogRelationKind' });

@InputType()
export class AdminRelationPageInput {
  @Field(() => CatalogRelationKind) @IsEnum(CatalogRelationKind) kind!: CatalogRelationKind;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() @Min(1) @Max(10000) page?: number;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() @Min(1) @Max(50) perPage?: number;
  @Field(() => Boolean, { nullable: true }) @IsOptional() @IsBoolean() onlyMine?: boolean;
}

@InputType()
export class CreateAdminRelationProposalInput {
  @Field(() => CatalogRelationKind) @IsEnum(CatalogRelationKind) kind!: CatalogRelationKind;
  @Field(() => ID) @IsUUID() sourceId!: string;
  @Field(() => ID) @IsUUID() targetId!: string;
  @Field() @IsString() @MinLength(1) @MaxLength(180) relationKey!: string;
  @Field() @IsString() @MinLength(2) @MaxLength(3000) detailsJson!: string;
  @Field() @IsString() @MinLength(1) @MaxLength(150) sourceName!: string;
  @Field() @IsString() @MinLength(1) @MaxLength(500) sourceReference!: string;
}

@ObjectType()
export class AdminRelationProposalType {
  @Field(() => ID) id!: string;
  @Field(() => CatalogRelationKind) kind!: CatalogRelationKind;
  @Field(() => ID) sourceId!: string;
  @Field(() => ID) targetId!: string;
  @Field() relationKey!: string;
  @Field() detailsJson!: string;
  @Field() sourceName!: string;
  @Field() sourceReference!: string;
  @Field() isQuarantined!: boolean;
  @Field() createdAt!: Date;
}

@ObjectType()
export class AdminRelationProposalPageType {
  @Field(() => [AdminRelationProposalType]) items!: AdminRelationProposalType[];
  @Field(() => Int) page!: number;
  @Field(() => Int) perPage!: number;
  @Field(() => Int) total!: number;
  @Field() hasNextPage!: boolean;
  @Field() available!: boolean;
}

@ObjectType()
export class AdminRelationEdgeType {
  @Field(() => ID) id!: string;
  @Field(() => ID) sourceId!: string;
  @Field(() => ID) targetId!: string;
  @Field() relationKey!: string;
  @Field(() => Boolean, { nullable: true }) isPublished!: boolean | null;
  @Field() createdAt!: Date;
}

@ObjectType()
export class AdminRelationCanonicalPageType {
  @Field(() => [AdminRelationEdgeType]) items!: AdminRelationEdgeType[];
  @Field(() => Int) page!: number;
  @Field(() => Int) perPage!: number;
  @Field(() => Int, { nullable: true }) total!: number | null;
  @Field() hasNextPage!: boolean;
  @Field() available!: boolean;
}
