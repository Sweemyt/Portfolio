import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get<ConfigService>(ConfigService);

  app.disable('x-powered-by');
  // Le backend est derrière le proxy Next.js (rewrites) : on fait confiance à la boucle locale
  // pour lire l'IP réelle dans X-Forwarded-For. À revoir au moment de l'hébergement.
  app.set('trust proxy', 'loopback');
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.enableShutdownHooks();
  // Pas de CORS : le navigateur ne parle qu'à Next.js (même origine), qui relaie vers /api.

  if (config.get('NODE_ENV') !== 'production') {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Portfolio API').setVersion('0.1.0').build(),
    );
    SwaggerModule.setup('api/docs', app, cleanupOpenApiDoc(document));
  }

  await app.listen(
    config.getOrThrow<string | number>('PORT'),
    config.getOrThrow<string>('HOST'),
  );
}

await bootstrap();
