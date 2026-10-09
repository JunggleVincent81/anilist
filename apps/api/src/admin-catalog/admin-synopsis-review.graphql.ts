import { Field, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsIn, IsInt, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

@InputType()
export class SubmitAdminSynopsisInput {
  @Field(() => ID) @IsUUID() draftId!: string;
  @Field(() => Int) @IsInt() @Min(1) @Max(2147483646) expectedRevision!: number;
}

@InputType()
export class ReviewAdminSynopsisInput extends SubmitAdminSynopsisInput {
  @Field() @IsString() @IsIn(['REQUEST_CHANGES', 'REJECT']) action!: 'REQUEST_CHANGES' | 'REJECT';
  @Field() @IsString() @MinLength(5) @MaxLength(2000) note!: string;
}

@ObjectType()
export class AdminSynopsisWorkflowType {
  @Field(() => ID) id!: string;
  @Field() state!: string;
  @Field(() => Int) revision!: number;
}
