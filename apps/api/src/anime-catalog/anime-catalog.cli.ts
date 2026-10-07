import {
  NestFactory,
} from '@nestjs/core';

import {
  loadEnvironment,
} from '../config/environment.js';

import {
  AnimeCatalogModule,
} from './anime-catalog.module.js';

import {
  AnimeCatalogService,
} from './anime-catalog.service.js';

async function main():
  Promise<void> {
  loadEnvironment();

  const app =
    await NestFactory
      .createApplicationContext(
        AnimeCatalogModule,
        {
          logger: false,
        },
      );

  try {
    const service =
      app.get(
        AnimeCatalogService,
      );

    const result =
      await service
        .classifyAll();

    console.log(
      JSON.stringify(
        result,
        null,
        2,
      ),
    );
  } finally {
    await app.close();
  }
}

main().catch(
  (
    error:
      unknown,
  ) => {
    console.error(
      error,
    );

    process.exitCode = 1;
  },
);