import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { Logger, LogLevel } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe, HttpStatus } from '@nestjs/common';

async function bootstrap() {
  // Configure logging levels based on DEBUG environment variable
  const debugMode = process.env.DEBUG?.toLowerCase() === 'true';
  const logLevels: LogLevel[] = debugMode 
    ? ['error', 'warn', 'log', 'debug', 'verbose']
    : ['error', 'warn', 'log'];

  const app = await NestFactory.create(AppModule, {
    logger: logLevels,
  });

  // Add cookie parser middleware
  app.use(cookieParser());

  // Add global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      errorHttpStatusCode: HttpStatus.BAD_REQUEST,
    }),
  );

  // Add global request logging middleware only in debug mode
  if (debugMode) {
    app.use((req, res, next) => {
      const logger = new Logger('HTTP');
      logger.debug(`[${req.method}] ${req.url}`);
      
      // Sanitize headers before logging
      const sanitizedHeaders = { ...req.headers };
      if (sanitizedHeaders.authorization) {
        sanitizedHeaders.authorization = sanitizedHeaders.authorization.replace(
          /Bearer .+/,
          'Bearer [REDACTED]'
        );
      }
      
      logger.debug('Headers:', JSON.stringify(sanitizedHeaders, null, 2));
      logger.debug('Query:', JSON.stringify(req.query, null, 2));
      
      // Sanitize request body before logging
      const sanitizedBody = { ...req.body };
      if (sanitizedBody.password) {
        sanitizedBody.password = '[REDACTED]';
      }
      logger.debug('Body:', JSON.stringify(sanitizedBody, null, 2));

      // Log response
      const originalSend = res.send;
      res.send = function (body) {
        try {
          const parsedBody = JSON.parse(body);
          // Sanitize response body before logging
          if (parsedBody.token || parsedBody.access_token) {
            const sanitizedResponse = { ...parsedBody };
            if (sanitizedResponse.token) sanitizedResponse.token = '[REDACTED]';
            if (sanitizedResponse.access_token) sanitizedResponse.access_token = '[REDACTED]';
            logger.debug('Response:', JSON.stringify(sanitizedResponse, null, 2));
          } else {
            logger.debug('Response:', JSON.stringify(parsedBody, null, 2));
          }
        } catch (e) {
          // If body is not JSON, log as is
          logger.debug('Response: [Non-JSON response]');
        }
        return originalSend.call(this, body);
      };

      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.debug(`Request completed in ${duration}ms with status ${res.statusCode}`);
      });

      next();
    });
  }

  // CORS Configuration
  const allowedOrigins = (
    process.env.ALLOWED_ORIGINS || 'http://localhost:3001'
  )
    .split(',')
    .map((origin) => origin.trim());

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }

      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        allowedOrigins.includes('*')
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    maxAge: 1800, // Cache preflight requests for 30 minutes
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('BAWES ERP API')
    .setDescription('The BAWES ERP system API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Export Swagger JSON
  writeFileSync(
    join(__dirname, '..', 'swagger.json'),
    JSON.stringify(document, null, 2),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
