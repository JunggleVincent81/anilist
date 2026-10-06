import { Module } from '@nestjs/common';

import { AuthContextService } from './auth-context.service.js';
import { AuthResolver } from './auth.resolver.js';
import { AuthService } from './auth.service.js';
import {
  RequireAuthGuard,
} from './authorization/require-auth.guard.js';
import {
  RolesGuard,
} from './authorization/roles.guard.js';

@Module({
  providers: [
    AuthContextService,
    AuthService,
    AuthResolver,
    RequireAuthGuard,
    RolesGuard,
  ],

  exports: [
    AuthContextService,
    AuthService,
    RequireAuthGuard,
    RolesGuard,
  ],
})
export class AuthModule {}