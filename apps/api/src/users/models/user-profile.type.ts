import {
  Field,
  GraphQLISODateTime,
  ID,
  ObjectType,
} from '@nestjs/graphql';
import { UserRole } from '@prisma/client';

@ObjectType('UserProfile')
export class UserProfileType {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  username!: string;

  @Field(() => String, {
    nullable: true,
  })
  displayName!: string | null;

  @Field(() => String, {
    nullable: true,
  })
  bio!: string | null;

  @Field(() => String, {
    nullable: true,
  })
  avatarUrl!: string | null;

  @Field(() => UserRole)
  role!: UserRole;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;
}