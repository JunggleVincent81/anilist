import { Field, ID, Int, ObjectType, InputType, registerEnumType, GraphQLISODateTime } from '@nestjs/graphql';
import { NotificationKind } from '@prisma/client';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

registerEnumType(NotificationKind, { name: 'NotificationKind' });

@ObjectType('NotificationActor')
export class NotificationActorType {
  @Field(() => ID) id!: string;
  @Field() username!: string;
  @Field(() => String, { nullable: true }) displayName!: string | null;
  @Field(() => String, { nullable: true }) avatarUrl!: string | null;
}

@ObjectType('SocialNotification')
export class SocialNotificationType {
  @Field(() => ID) id!: string;
  @Field(() => NotificationKind) kind!: NotificationKind;
  @Field(() => ID) sourceId!: string;
  @Field(() => ID, { nullable: true }) targetActivityId!: string | null;
  @Field() isRead!: boolean;
  @Field(() => GraphQLISODateTime) createdAt!: Date;
  @Field(() => NotificationActorType) actor!: NotificationActorType;
}

@ObjectType('NotificationPageInfo')
export class NotificationPageInfoType {
  @Field(() => Int) page!: number;
  @Field(() => Int) perPage!: number;
  @Field(() => Int) total!: number;
  @Field(() => Int) pageCount!: number;
  @Field() hasNextPage!: boolean;
  @Field() hasPreviousPage!: boolean;
}

@ObjectType('SocialNotificationPage')
export class SocialNotificationPageType {
  @Field(() => [SocialNotificationType]) items!: SocialNotificationType[];
  @Field(() => NotificationPageInfoType) pageInfo!: NotificationPageInfoType;
}

@InputType('NotificationFeedInput')
export class NotificationFeedInput {
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

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  unreadOnly?: boolean;
}
