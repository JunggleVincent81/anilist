import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  Field,
  InputType,
} from '@nestjs/graphql';

@InputType('RegisterInput')
export class RegisterInput {
  @Field()
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim().toLowerCase()
      : value,
  )
  @IsString()
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @Field()
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim().toLowerCase()
      : value,
  )
  @IsString()
  @Length(3, 24)
  @Matches(/^[a-z0-9_]+$/)
  username!: string;

  @Field()
  @IsString()
  @Length(6, 128)
  password!: string;
}