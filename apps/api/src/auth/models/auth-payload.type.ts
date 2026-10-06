import {
  Field,
  ObjectType,
} from '@nestjs/graphql';

import { AuthUserType } from './auth-user.type.js';

@ObjectType('AuthPayload')
export class AuthPayloadType {
  @Field(() => AuthUserType)
  user!: AuthUserType;
}