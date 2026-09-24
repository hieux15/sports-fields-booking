import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { SWAGGER_PATH, setupSwagger } from './swagger';
import { UPLOAD_ROOT_DIR, StorageService } from './storage/storage.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

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

  // Ảnh sân có thể nằm ở backend/uploads khi chưa cấu hình Supabase Storage;
  // phục vụ tĩnh tại /uploads để client hiển thị được qua URL trong imageUrl.
  app.useStaticAssets(join(process.cwd(), UPLOAD_ROOT_DIR), {
    prefix: `/${UPLOAD_ROOT_DIR}/`,
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

  // Log driver để người chạy demo biết ảnh sân đang được lưu ở đâu.
  const storage = app.get(StorageService);
  if (storage.driver === 'local') {
    logger.log(
      `Court photos -> ${join(process.cwd(), UPLOAD_ROOT_DIR)} (set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to use Supabase Storage)`,
    );
  } else {
    logger.log('Court photos -> Supabase Storage');
  }

  if (swaggerEnabled) {
    logger.log(
      `Swagger UI available at http://localhost:${port}/${SWAGGER_PATH}`,
    );
  }
}

void bootstrap();
