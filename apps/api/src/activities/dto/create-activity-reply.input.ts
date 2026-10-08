import {
  Field,
  InputType,
} from '@nestjs/graphql';

import {
  IsString,
  MaxLength,
} from 'class-validator';

@InputType()
class CreateActivityReplyInput {
  @Field()
  @IsString()
  @MaxLength(500)
  body!: string;
}

export {
  CreateActivityReplyInput,
};
