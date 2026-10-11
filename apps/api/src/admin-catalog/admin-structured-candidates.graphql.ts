import { Field, ID, InputType, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

export enum AdminStructuredSubject {
  ANIME = 'ANIME', ANIME_EPISODE = 'ANIME_EPISODE',
  MANGA_WORK = 'MANGA_WORK', MANGA_VOLUME = 'MANGA_VOLUME', MANGA_CHAPTER = 'MANGA_CHAPTER',
  MUSIC_TRACK = 'MUSIC_TRACK', MUSIC_ARTIST = 'MUSIC_ARTIST',
  MUSIC_RECORDING = 'MUSIC_RECORDING', MUSIC_RELEASE = 'MUSIC_RELEASE',
}
registerEnumType(AdminStructuredSubject, { name: 'AdminStructuredSubject' });

@InputType()
export class AdminStructuredCandidatePageInput {
  @Field(() => AdminStructuredSubject) @IsEnum(AdminStructuredSubject) subjectType!: AdminStructuredSubject;
  @Field(() => Int, {nullable:true}) @IsOptional() @IsInt() @Min(1) @Max(100000) page?: number;
  @Field(() => Int, {nullable:true}) @IsOptional() @IsInt() @Min(1) @Max(50) perPage?: number;
  @Field({nullable:true}) @IsOptional() @IsString() @MaxLength(120) search?: string;
  @Field(() => Boolean, {nullable:true}) @IsOptional() @IsBoolean() onlyMine?: boolean;
}

@InputType()
export class CreateAdminStructuredCandidateInput {
  @Field(() => AdminStructuredSubject) @IsEnum(AdminStructuredSubject) subjectType!: AdminStructuredSubject;
  @Field() @IsString() @MinLength(1) @MaxLength(150) sourceName!: string;
  @Field() @IsString() @MinLength(1) @MaxLength(500) sourceReference!: string;
  @Field() @IsString() @MinLength(2) @MaxLength(16000) fieldsJson!: string;
}

@InputType()
export class UpdateAdminStructuredCandidateInput extends CreateAdminStructuredCandidateInput {
  @Field(() => ID) @IsUUID() candidateId!: string;
  @Field() @IsString() expectedUpdatedAt!: string;
}

@ObjectType()
export class AdminStructuredCandidateType {
  @Field(() => ID) id!: string;
  @Field(() => AdminStructuredSubject) subjectType!: AdminStructuredSubject;
  @Field() sourceName!: string;
  @Field() sourceReference!: string;
  @Field(() => String, {nullable:true}) fieldsJson!: string | null;
  @Field() isQuarantined!: boolean;
  @Field() editable!: boolean;
  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;
}

@ObjectType()
export class AdminStructuredCandidatePageType {
  @Field(() => [AdminStructuredCandidateType]) items!: AdminStructuredCandidateType[];
  @Field(() => Int) page!: number;
  @Field(() => Int) perPage!: number;
  @Field(() => Int) total!: number;
  @Field() hasNextPage!: boolean;
}
