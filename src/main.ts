import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import * as path from 'path';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Global validation pipe configuration
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('AslasChat API Documentation')
    .setDescription('The AslasChat API Documentation page.')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Serve static files from the "uploads" directory
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

  // Apply JSON and URL-encoded middleware globally
  app.use((req, res, next) => {
    // Check if the request is for the Stripe webhook endpoint
    if (req.path === '/stripe-webhooks') {
      next(); // Skip urlencoded parsing for Stripe webhook endpoint
    } else {
      // Apply urlencoded middleware for all other paths
      json({ limit: '50mb' })(req, res, (err) => {
        if (err) return next(err);
        // Apply URL-encoded middleware
        urlencoded({ extended: true, limit: '50mb' })(req, res, next);
      });
    }
  });

  // Enable CORS
  app.enableCors();

  // Start the application
  await app.listen(3000);
}
bootstrap();
