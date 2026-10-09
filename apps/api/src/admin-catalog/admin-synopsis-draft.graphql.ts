import { Field, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

@InputType()
export class CreateAdminSynopsisDraftInput {
  @Field(() => ID) @IsUUID() animeId!: string;
  @Field() @IsString() @MinLength(1) @MaxLength(10000) synopsis!: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(500) reason?: string;
}

@InputType()
export class UpdateAdminSynopsisDraftInput {
  @Field(() => ID) @IsUUID() draftId!: string;
  @Field(() => Int) @IsInt() @Min(1) @Max(2147483646) expectedRevision!: number;
  @Field() @IsString() @MinLength(1) @MaxLength(10000) synopsis!: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(500) reason?: string;
}

@ObjectType()
export class AdminSynopsisDraftType {
  @Field(() => ID) id!: string;
  @Field(() => ID) animeId!: string;
  @Field(() => Int) revision!: number;
  @Field() synopsis!: string;
  @Field(() => String, { nullable: true }) reason!: string | null;
  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;
}
