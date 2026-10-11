import { Field, ID, InputType, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { CatalogAssetKind } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

registerEnumType(CatalogAssetKind, { name: 'AdminMediaIntakeKind' });

@InputType()
export class AdminMediaEvidencePageInput {
  @Field(() => Int, { nullable:true }) @IsOptional() @IsInt() @Min(1) @Max(10000) page?:number;
  @Field(() => Int, { nullable:true }) @IsOptional() @IsInt() @Min(1) @Max(50) perPage?:number;
  @Field(() => Boolean, { nullable:true }) @IsOptional() @IsBoolean() onlyMine?:boolean;
}
@InputType()
export class CreateAdminSourceDossierInput {
  @Field() @IsString() @MinLength(10) @MaxLength(2048) sourceUrl!:string;
  @Field() @IsString() @MinLength(2) @MaxLength(191) publisher!:string;
  @Field() @IsString() @MinLength(20) @MaxLength(500) rightsBasis!:string;
  @Field(() => String, {nullable:true}) @IsOptional() @IsString() @MaxLength(100) licenseLabel?:string;
  @Field(() => String, {nullable:true}) @IsOptional() @IsString() @MaxLength(500) attribution?:string;
  @Field(() => String, {nullable:true}) @IsOptional() @IsString() expiresAt?:string;
}
@InputType()
export class CreateAdminMediaIntakeInput {
  @Field(() => ID) @IsUUID() animeId!:string;
  @Field(() => ID) @IsUUID() sourceDossierId!:string;
  @Field(() => CatalogAssetKind) @IsEnum(CatalogAssetKind) kind!:CatalogAssetKind;
  @Field() @IsString() sha256!:string;
  @Field() @IsString() mime!:string;
  @Field(() => Int) @IsInt() @Min(1) @Max(50000000) byteLength!:number;
  @Field(() => Int) @IsInt() @Min(1) @Max(20000) width!:number;
  @Field(() => Int) @IsInt() @Min(1) @Max(20000) height!:number;
  @Field() @IsString() @MinLength(2) @MaxLength(255) copyrightOwner!:string;
}
@ObjectType()
export class AdminSourceDossierType {
  @Field(() => ID) id!:string;
  @Field() sourceUrl!:string;
  @Field() publisher!:string;
  @Field() rightsBasis!:string;
  @Field(() => String, {nullable:true}) licenseLabel!:string|null;
  @Field(() => String, {nullable:true}) attribution!:string|null;
  @Field(() => Date, {nullable:true}) expiresAt!:Date|null;
  @Field(() => Date, {nullable:true}) revokedAt!:Date|null;
  @Field() isQuarantined!:boolean;
  @Field() createdAt!:Date;
}
@ObjectType()
export class AdminMediaIntakeType {
  @Field(() => ID) id!:string;
  @Field(() => ID) animeId!:string;
  @Field(() => ID) sourceDossierId!:string;
  @Field(() => CatalogAssetKind) kind!:CatalogAssetKind;
  @Field() sha256!:string;
  @Field() mime!:string;
  @Field(() => Int) byteLength!:number;
  @Field(() => Int) width!:number;
  @Field(() => Int) height!:number;
  @Field() copyrightOwner!:string;
  @Field() isQuarantined!:boolean;
  @Field() createdAt!:Date;
}
@ObjectType()
export class AdminSourceDossierPageType {
  @Field(() => [AdminSourceDossierType]) items!:AdminSourceDossierType[];
  @Field(() => Int) page!:number;
  @Field(() => Int) perPage!:number;
  @Field(() => Int, {nullable:true}) total!:number|null;
  @Field() hasNextPage!:boolean;
  @Field() available!:boolean;
}
@ObjectType()
export class AdminMediaIntakePageType {
  @Field(() => [AdminMediaIntakeType]) items!:AdminMediaIntakeType[];
  @Field(() => Int) page!:number;
  @Field(() => Int) perPage!:number;
  @Field(() => Int, {nullable:true}) total!:number|null;
  @Field() hasNextPage!:boolean;
  @Field() available!:boolean;
}
