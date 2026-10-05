import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { loadEnvironment } from './config/environment.js';

async function bootstrap() {
  const environment = loadEnvironment();
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: environment.webUrl });
  app.enableShutdownHooks();
  await app.listen(environment.apiPort);
}

void bootstrap();
