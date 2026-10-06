import {
  Transform,
} from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import {
  Field,
  InputType,
} from '@nestjs/graphql';

function normalizeOptionalText(
  value: unknown,
): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized =
    value.trim();

  return normalized.length
    ? normalized
    : null;
}

@InputType('UpdateProfileInput')
export class UpdateProfileInput {
  @Field(() => String, {
    nullable: true,
  })
  @Transform(({ value }) =>
    normalizeOptionalText(value),
  )
  @IsOptional()
  @IsString()
  @MaxLength(80)
  displayName?: string | null;

  @Field(() => String, {
    nullable: true,
  })
  @Transform(({ value }) =>
    normalizeOptionalText(value),
  )
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string | null;

  @Field(() => String, {
    nullable: true,
  })
  @Transform(({ value }) =>
    normalizeOptionalText(value),
  )
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @IsUrl({
    protocols: [
      'http',
      'https',
    ],
    require_protocol: true,
  })
  avatarUrl?: string | null;
}