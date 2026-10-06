import {
  SetMetadata,
} from '@nestjs/common';
import type {
  UserRole,
} from '@prisma/client';

const ROLES_KEY =
  'auth:roles';

const Roles = (
  ...roles: UserRole[]
) =>
  SetMetadata(
    ROLES_KEY,
    roles,
  );

export {
  ROLES_KEY,
  Roles,
};