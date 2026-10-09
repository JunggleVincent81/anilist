import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PublicMangaWork {
  @Field(() => ID) id!: string;
  @Field() slug!: string;
  @Field() title!: string;
  @Field(() => String, { nullable: true }) synopsis!: string | null;
  @Field() sourceName!: string;
  @Field() sourceReference!: string;
}

@ObjectType()
export class PublicAnimeMusicTrack {
  @Field(() => ID) id!: string;
  @Field() slug!: string;
  @Field() title!: string;
  @Field() artistName!: string;
  @Field() category!: string;
  @Field(() => String, { nullable: true }) animeSlug!: string | null;
  @Field() sourceName!: string;
  @Field() sourceReference!: string;
}
