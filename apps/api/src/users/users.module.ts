import {
  Module,
} from '@nestjs/common';

import {
  AuthModule,
} from '../auth/auth.module.js';

import {
  UsersResolver,
} from './users.resolver.js';
import {
  UsersService,
} from './users.service.js';

@Module({
  imports: [
    AuthModule,
  ],

  providers: [
    UsersService,
    UsersResolver,
  ],

  exports: [
    UsersService,
  ],
})
export class UsersModule {}