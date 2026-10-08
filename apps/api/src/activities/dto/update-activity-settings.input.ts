import {
  Field,
  InputType,
} from '@nestjs/graphql';

import {
  ActivityVisibility,
} from '@prisma/client';

import {
  IsBoolean,
  IsEnum,
  IsOptional,
} from 'class-validator';

@InputType()
class UpdateActivitySettingsInput {
  @Field(
    () => Boolean,
    {
      nullable: true,
    },
  )
  @IsOptional()
  @IsBoolean()
  autoActivityEnabled?:
    boolean;

  @Field(
    () =>
      ActivityVisibility,
    {
      nullable: true,
    },
  )
  @IsOptional()
  @IsEnum(
    ActivityVisibility,
  )
  activityVisibility?:
    ActivityVisibility;
}

export {
  UpdateActivitySettingsInput,
};
