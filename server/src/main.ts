import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { swaggerConfig } from './config/swagger/config';
import { ValidationPipe } from '@nestjs/common';
import compression from 'compression';
import { corsConfig } from './config/cors/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  swaggerConfig(app);
  app.use(compression());
  corsConfig(app);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
