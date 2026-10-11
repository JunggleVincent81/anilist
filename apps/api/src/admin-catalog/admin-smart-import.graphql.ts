import { Field, ID, InputType, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { CatalogImportStatus, EditorialSubjectType } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

registerEnumType(CatalogImportStatus,{name:'AdminImportStatus'});
registerEnumType(EditorialSubjectType,{name:'AdminImportSubjectType'});

@InputType()
export class PreviewAdminImportInput {
  @Field(() => EditorialSubjectType) @IsEnum(EditorialSubjectType) subjectType!:EditorialSubjectType;
  @Field() @IsString() @MinLength(1) @MaxLength(150) fileName!:string;
  @Field() @IsString() @MinLength(2) @MaxLength(90000) base64!:string;
  @Field() @IsString() @MinLength(2) @MaxLength(150) sourceName!:string;
  @Field() @IsString() @MinLength(4) @MaxLength(450) sourceReference!:string;
}
@InputType()
export class AdminImportHistoryInput {
  @Field(() => Int,{nullable:true}) @IsOptional() @IsInt() @Min(1) @Max(10000) page?:number;
  @Field(() => Int,{nullable:true}) @IsOptional() @IsInt() @Min(1) @Max(50) perPage?:number;
}
@ObjectType()
export class AdminImportBatchType {
  @Field(() => ID) id!:string;
  @Field(() => EditorialSubjectType) subjectType!:EditorialSubjectType;
  @Field() fileName!:string;
  @Field() fileSha256!:string;
  @Field() format!:string;
  @Field() sourceName!:string;
  @Field() sourceReference!:string;
  @Field(() => CatalogImportStatus) status!:CatalogImportStatus;
  @Field(() => Int) rowCount!:number;
  @Field(() => Int) validCount!:number;
  @Field(() => Int) invalidCount!:number;
  @Field(() => Int) createdCount!:number;
  @Field(() => Int) skippedCount!:number;
  @Field() issuesJson!:string;
  @Field() createdAt!:Date;
  @Field(() => Date,{nullable:true}) appliedAt!:Date|null;
}
@ObjectType()
export class AdminImportHistoryPageType {
  @Field(() => [AdminImportBatchType]) items!:AdminImportBatchType[];
  @Field(() => Int) page!:number;
  @Field(() => Int) perPage!:number;
  @Field(() => Int,{nullable:true}) total!:number|null;
  @Field() hasNextPage!:boolean;
  @Field() available!:boolean;
}
@InputType()
export class ApplyAdminImportInput {
  @Field(() => ID) @IsUUID() batchId!:string;
  @Field() @IsString() @MinLength(64) @MaxLength(64) expectedFileSha256!:string;
}
