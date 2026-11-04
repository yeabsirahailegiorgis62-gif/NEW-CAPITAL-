// SERVER: NestJS application entry point. Creates the HTTP server, applies global
// middleware, and listens on PORT (default 4100).
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

import { json, urlencoded } from 'express';

async function bootstrap() {
  const logger = new Logger('CapitalFleetAPI');
  const app = await NestFactory.create(AppModule);

  app.enableShutdownHooks();
  // REST API: All controllers are mounted under /api (e.g. /api/bookings).
  app.setGlobalPrefix('api');

  // Payload body parser limits for photo uploads
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true }));

  // MIDDLEWARE: Runs on every request to attach browser security headers.
  app.use((req: any, res: any, next: any) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // EXCEPTION HANDLING: Converts thrown NestJS/HTTP errors into a consistent JSON body.
  app.useGlobalFilters(new AllExceptionsFilter());

  // VALIDATION: class-validator DTOs are checked before controller methods run.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // CORS: Allows the Vite frontend (port 5173) to call this API from the browser.
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
    ],
    credentials: true,
  });

  // OpenAPI Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Capital Fleet API')
    .setDescription('Vehicle Booking & Logistics Management System for Capital Real Estate')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4100;
  await app.listen(port);

  logger.log(`Capital Fleet API running at http://localhost:${port}/api`);
  logger.log(`Swagger OpenAPI documentation available at http://localhost:${port}/api/docs`);
}

bootstrap();
