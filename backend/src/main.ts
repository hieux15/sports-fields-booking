import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SWAGGER_PATH, setupSwagger } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global pipes must be registered before the server starts listening,
  // otherwise validation is never applied to incoming requests.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Config đã được validate lúc khởi động (xem config/env.validation.ts).
  const config = app.get(ConfigService);

  const corsOrigins = (config.get<string>('CORS_ORIGIN') ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Bật mặc định để người xem demo mở được /docs; đặt SWAGGER_ENABLED=false để tắt.
  const swaggerEnabled = config.get<string>('SWAGGER_ENABLED') !== 'false';
  if (swaggerEnabled) {
    setupSwagger(app);
  }

  const port = Number(config.get('PORT') ?? 3000);
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`API listening on http://localhost:${port}`);
  if (swaggerEnabled) {
    logger.log(
      `Swagger UI available at http://localhost:${port}/${SWAGGER_PATH}`,
    );
  }
}

void bootstrap();
