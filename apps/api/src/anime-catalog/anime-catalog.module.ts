import {
  Module,
} from '@nestjs/common';

import {
  DatabaseModule,
} from '../database/database.module.js';

import {
  AnimeCatalogService,
} from './anime-catalog.service.js';

@Module({
  imports: [
    DatabaseModule,
  ],

  providers: [
    AnimeCatalogService,
  ],

  exports: [
    AnimeCatalogService,
  ],
})
export class AnimeCatalogModule {}