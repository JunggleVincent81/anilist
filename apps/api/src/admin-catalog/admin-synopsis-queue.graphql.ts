import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AdminSynopsisQueueItem {
  @Field(() => ID) id!: string;
  @Field(() => ID) animeId!: string;
  @Field(() => ID) creatorId!: string;
  @Field(() => Int) revision!: number;
  @Field() state!: string;
  @Field() synopsis!: string;
  @Field({ nullable: true }) reason!: string | null;
  @Field() createdAt!: Date;
  @Field({ nullable: true }) submittedAt!: Date | null;
}

@ObjectType()
export class AdminSynopsisQueuePage {
  @Field(() => [AdminSynopsisQueueItem]) items!: AdminSynopsisQueueItem[];
  @Field(() => Int) page!: number;
  @Field(() => Int) perPage!: number;
  @Field(() => Int) total!: number;
  @Field() hasNextPage!: boolean;
}
