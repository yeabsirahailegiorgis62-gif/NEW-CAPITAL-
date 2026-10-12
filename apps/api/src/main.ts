import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const logger = new Logger('CapitalFleetAPI');
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

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
