import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  Field,
  InputType,
} from '@nestjs/graphql';

@InputType('LoginInput')
export class LoginInput {
  @Field()
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim().toLowerCase()
      : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(320)
  identifier!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password!: string;
}