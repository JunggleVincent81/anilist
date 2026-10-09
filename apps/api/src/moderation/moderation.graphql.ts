import { Field, GraphQLISODateTime, ID, InputType, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { ReportReason, ReportStatus, ReportTargetType } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

registerEnumType(ReportTargetType, { name: 'ReportTargetType' });
registerEnumType(ReportReason, { name: 'ReportReason' });
registerEnumType(ReportStatus, { name: 'ReportStatus' });

@InputType()
export class SubmitContentReportInput {
  @Field(() => ReportTargetType)
  @IsEnum(ReportTargetType)
  targetType!: ReportTargetType;

  @Field(() => ID)
  @IsUUID('4')
  targetId!: string;

  @Field(() => ReportReason)
  @IsEnum(ReportReason)
  reason!: ReportReason;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  details?: string;
}

@InputType()
export class ReportPageInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  perPage?: number;
}

@InputType()
export class ModerationQueueInput extends ReportPageInput {
  @Field(() => ReportStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;
}

@InputType()
export class ResolveContentReportInput {
  @Field(() => ID)
  @IsUUID('4')
  id!: string;

  @Field(() => ReportStatus)
  @IsEnum(ReportStatus)
  status!: ReportStatus;

  @Field()
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  note!: string;
}

@ObjectType()
export class ContentReportReceiptType {
  @Field(() => ID) id!: string;
  @Field(() => ReportTargetType) targetType!: ReportTargetType;
  @Field(() => ID) targetId!: string;
  @Field(() => ReportReason) reason!: ReportReason;
  @Field(() => String, { nullable: true }) details!: string | null;
  @Field(() => ReportStatus) status!: ReportStatus;
  @Field(() => GraphQLISODateTime) createdAt!: Date;
  @Field(() => GraphQLISODateTime) updatedAt!: Date;
  @Field(() => GraphQLISODateTime, { nullable: true }) reviewedAt!: Date | null;
}

@ObjectType()
export class ReportUserType {
  @Field(() => ID) id!: string;
  @Field() username!: string;
}

@ObjectType()
export class ModerationReportType extends ContentReportReceiptType {
  @Field(() => ReportUserType) reporter!: ReportUserType;
  @Field(() => ReportUserType, { nullable: true }) reviewer!: ReportUserType | null;
  @Field(() => String, { nullable: true }) moderatorNote!: string | null;
}

@ObjectType()
export class ContentReportPageInfoType {
  @Field(() => Int) page!: number;
  @Field(() => Int) perPage!: number;
  @Field(() => Int) total!: number;
  @Field(() => Int) pageCount!: number;
  @Field() hasNextPage!: boolean;
  @Field() hasPreviousPage!: boolean;
}

@ObjectType()
export class MyContentReportsPageType {
  @Field(() => [ContentReportReceiptType]) items!: ContentReportReceiptType[];
  @Field(() => ContentReportPageInfoType) pageInfo!: ContentReportPageInfoType;
}

@ObjectType()
export class ModerationReportsPageType {
  @Field(() => [ModerationReportType]) items!: ModerationReportType[];
  @Field(() => ContentReportPageInfoType) pageInfo!: ContentReportPageInfoType;
}
