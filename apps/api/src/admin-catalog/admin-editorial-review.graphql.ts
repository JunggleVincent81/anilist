import { Field, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

@InputType()
export class AdminEditorialPageInput {
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() @Min(1) @Max(10000) page?: number;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() @Min(1) @Max(50) perPage?: number;
  @Field(() => Boolean, { nullable: true }) @IsOptional() @IsBoolean() onlyMine?: boolean;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString()
  @IsIn(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REVOKED']) state?: string;
}

@InputType()
export class CreateAdminEditorialCaseInput {
  @Field(() => ID) @IsUUID() candidateId!: string;
  @Field(() => ID, { nullable: true }) @IsOptional() @IsUUID() canonicalEntityId?: string;
}

@InputType()
export class TransitionAdminEditorialCaseInput {
  @Field(() => ID) @IsUUID() caseId!: string;
  @Field(() => Int) @IsInt() @Min(1) @Max(2147483646) expectedRevision!: number;
  @Field() @IsIn(['SUBMIT', 'BEGIN_REVIEW', 'REQUEST_CHANGES', 'REJECT']) action!: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() @MaxLength(2000) note?: string;
}

@ObjectType()
export class AdminEditorialCaseItemType {
  @Field(() => ID) id!: string;
  @Field(() => ID) candidateId!: string;
  @Field(() => ID, { nullable: true }) canonicalEntityId!: string | null;
  @Field() subjectType!: string;
  @Field() state!: string;
  @Field(() => Int) revision!: number;
  @Field(() => ID, { nullable: true }) openedById!: string | null;
  @Field() candidateLabel!: string;
  @Field() sourceName!: string;
  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;
}

@ObjectType()
export class AdminEditorialCasePageType {
  @Field(() => [AdminEditorialCaseItemType]) items!: AdminEditorialCaseItemType[];
  @Field(() => Int) page!: number;
  @Field(() => Int) perPage!: number;
  @Field(() => Int, { nullable: true }) total!: number | null;
  @Field() hasNextPage!: boolean;
  @Field() available!: boolean;
}

@ObjectType()
export class AdminEditorialHistoryItemType {
  @Field(() => ID) id!: string;
  @Field(() => ID) actorId!: string;
  @Field() action!: string;
  @Field() fromState!: string;
  @Field() toState!: string;
  @Field(() => Int) previousRevision!: number;
  @Field(() => Int) nextRevision!: number;
  @Field(() => String, { nullable: true }) note!: string | null;
  @Field() createdAt!: Date;
}

@ObjectType()
export class AdminEditorialCaseDetailType extends AdminEditorialCaseItemType {
  @Field() sourceReference!: string;
  @Field(() => String, { nullable: true }) proposedJson!: string | null;
  @Field(() => String, { nullable: true }) canonicalBeforeJson!: string | null;
  @Field() comparisonStatus!: string;
  @Field(() => [AdminEditorialHistoryItemType]) history!: AdminEditorialHistoryItemType[];
  @Field() commitReady!: boolean;
  @Field(() => [String]) blockers!: string[];
}
