import {
  ValidationPipe,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';
import { loadEnvironment } from './config/environment.js';

async function bootstrap() {
  const environment =
    loadEnvironment();

  const app =
    await NestFactory.create(
      AppModule,
    );

  app.enableCors({
    origin: environment.webUrl,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      validationError: {
        target: false,
        value: false,
      },
      stopAtFirstError: true,
    }),
  );

  app.enableShutdownHooks();

  await app.listen(
    environment.apiPort,
  );
}

void bootstrap();