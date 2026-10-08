import {
  Field,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';

import {
  ActivityVisibility,
} from '@prisma/client';

registerEnumType(
  ActivityVisibility,
  {
    name:
      'ActivityVisibility',
  },
);

@ObjectType()
class ActivitySettingsType {
  @Field(() => Boolean)
  autoActivityEnabled!: boolean;

  @Field(
    () =>
      ActivityVisibility,
  )
  activityVisibility!:
    ActivityVisibility;
}

export {
  ActivitySettingsType,
};
