import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AdminWorkspaceMangaMetrics {
  @Field(() => Boolean) available!: boolean;
  @Field(() => Int, { nullable: true }) works!: number | null;
  @Field(() => Int, { nullable: true }) volumes!: number | null;
  @Field(() => Int, { nullable: true }) chapters!: number | null;
}

@ObjectType()
export class AdminWorkspaceMusicMetrics {
  @Field(() => Boolean) available!: boolean;
  @Field(() => Int, { nullable: true }) tracks!: number | null;
  @Field(() => Int, { nullable: true }) artists!: number | null;
  @Field(() => Int, { nullable: true }) recordings!: number | null;
  @Field(() => Int, { nullable: true }) releases!: number | null;
  @Field(() => Int, { nullable: true }) credits!: number | null;
}

@ObjectType()
export class AdminWorkspaceEditorialMetrics {
  @Field(() => Boolean) available!: boolean;
  @Field(() => Int, { nullable: true }) candidates!: number | null;
  @Field(() => Int, { nullable: true }) quarantined!: number | null;
  @Field(() => Int, { nullable: true }) cases!: number | null;
  @Field(() => Int, { nullable: true }) submitted!: number | null;
  @Field(() => Int, { nullable: true }) underReview!: number | null;
  @Field(() => Int, { nullable: true }) approved!: number | null;
}

@ObjectType()
export class AdminWorkspaceOverviewType {
  @Field(() => AdminWorkspaceMangaMetrics) manga!: AdminWorkspaceMangaMetrics;
  @Field(() => AdminWorkspaceMusicMetrics) music!: AdminWorkspaceMusicMetrics;
  @Field(() => AdminWorkspaceEditorialMetrics) editorial!: AdminWorkspaceEditorialMetrics;
}
