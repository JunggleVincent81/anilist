import {
  ValidationPipe,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';

import { AppModule } from './app.module.js';
import { loadEnvironment } from './config/environment.js';

async function bootstrap() {
  const environment =
    loadEnvironment();

  const app =
    await NestFactory.create<NestExpressApplication>(
      AppModule,
      { bodyParser: false },
    );

  // Set security headers even for failed body-parser requests.
  app.getHttpAdapter().getInstance().disable('x-powered-by');
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  // The default Nest Express parser accepts larger bodies than
  // necessary for a metadata/tracking GraphQL API.
  app.useBodyParser('json', { limit: '128kb' });
  app.useBodyParser('urlencoded', {
    extended: true,
    limit: '128kb',
  });

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