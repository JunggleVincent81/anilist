import {
  Field,
  InputType,
} from '@nestjs/graphql';

import {
  IsString,
  MaxLength,
} from 'class-validator';

@InputType()
class CreateTextActivityInput {
  @Field()
  @IsString()
  @MaxLength(500)
  text!: string;
}

export {
  CreateTextActivityInput,
};
