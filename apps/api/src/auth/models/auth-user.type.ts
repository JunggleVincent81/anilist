import { UserRole } from '@prisma/client';
import {
  Field,
  ID,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';

registerEnumType(UserRole, {
  name: 'UserRole',
});

@ObjectType('AuthUser')
export class AuthUserType {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  email!: string;

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
}