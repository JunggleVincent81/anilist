import { Field, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

@InputType()
export class AdminAnimeCandidatePageInput {
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() @Min(1) @Max(100000) page?: number;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() @Min(1) @Max(50) perPage?: number;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(120) search?: string;
  @Field(() => Boolean, { nullable: true }) @IsOptional() @IsBoolean() onlyMine?: boolean;
}

@InputType()
export class CreateAdminAnimeCandidateInput {
  @Field() @IsString() @MinLength(1) @MaxLength(150) sourceName!: string;
  @Field() @IsString() @MinLength(1) @MaxLength(500) sourceReference!: string;
  @Field() @IsString() @MinLength(1) @MaxLength(10000) synopsis!: string;
}

@InputType()
export class UpdateAdminAnimeCandidateInput extends CreateAdminAnimeCandidateInput {
  @Field(() => ID) @IsUUID() candidateId!: string;
  @Field() @IsString() expectedUpdatedAt!: string;
}

@ObjectType()
export class AdminAnimeCandidateType {
  @Field(() => ID) id!: string;
  @Field() sourceName!: string;
  @Field() sourceReference!: string;
  @Field(() => String, { nullable: true }) synopsis!: string | null;
  @Field() isQuarantined!: boolean;
  @Field() editable!: boolean;
  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;
}

@ObjectType()
export class AdminAnimeCandidatePageType {
  @Field(() => [AdminAnimeCandidateType]) items!: AdminAnimeCandidateType[];
  @Field(() => Int) page!: number;
  @Field(() => Int) perPage!: number;
  @Field(() => Int) total!: number;
  @Field(() => Boolean) hasNextPage!: boolean;
}
