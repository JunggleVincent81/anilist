import { Field, ID, InputType, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/** Private-only canonical inventory. These enums do not grant public release. */
export enum AdminDomainKind {
  MANGA_WORK = 'MANGA_WORK',
  MANGA_VOLUME = 'MANGA_VOLUME',
  MANGA_CHAPTER = 'MANGA_CHAPTER',
  MUSIC_TRACK = 'MUSIC_TRACK',
  MUSIC_ARTIST = 'MUSIC_ARTIST',
  MUSIC_RECORDING = 'MUSIC_RECORDING',
  MUSIC_RELEASE = 'MUSIC_RELEASE',
  MUSIC_RELEASE_TRACK = 'MUSIC_RELEASE_TRACK',
  MUSIC_CREDIT = 'MUSIC_CREDIT',
}
registerEnumType(AdminDomainKind, { name: 'AdminDomainKind' });

export enum AdminPublicationFilter {
  ALL = 'ALL',
  PRIVATE = 'PRIVATE',
  PUBLISHED = 'PUBLISHED',
}
registerEnumType(AdminPublicationFilter, { name: 'AdminPublicationFilter' });

@InputType()
export class AdminDomainPageInput {
  @Field(() => AdminDomainKind) @IsEnum(AdminDomainKind) domain!: AdminDomainKind;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() @Min(1) @Max(10000) page?: number;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() @Min(1) @Max(50) perPage?: number;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() @MaxLength(120) search?: string;
  @Field(() => AdminPublicationFilter, { nullable: true }) @IsOptional() @IsEnum(AdminPublicationFilter)
  publication?: AdminPublicationFilter;
}

@ObjectType()
export class AdminDomainRecordType {
  @Field(() => ID) id!: string;
  @Field(() => String) title!: string;
  @Field(() => String, { nullable: true }) subtitle!: string | null;
  @Field(() => String, { nullable: true }) sourceName!: string | null;
  @Field(() => String, { nullable: true }) sourceReference!: string | null;
  @Field(() => ID, { nullable: true }) relatedId!: string | null;
  @Field(() => Boolean) isPublished!: boolean;
  @Field(() => Boolean, { nullable: true }) isAdult!: boolean | null;
  @Field(() => Date) createdAt!: Date;
}

@ObjectType()
export class AdminDomainRecordPageType {
  @Field(() => AdminDomainKind) domain!: AdminDomainKind;
  @Field(() => Boolean) available!: boolean;
  @Field(() => [AdminDomainRecordType]) items!: AdminDomainRecordType[];
  @Field(() => Int) page!: number;
  @Field(() => Int) perPage!: number;
  @Field(() => Int, { nullable: true }) total!: number | null;
  @Field(() => Boolean) hasNextPage!: boolean;
}
