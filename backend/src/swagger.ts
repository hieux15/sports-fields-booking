import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

/** Đường dẫn Swagger UI; JSON của document nằm ở `/docs-json`. */
export const SWAGGER_PATH = 'docs';

/**
 * Tạo OpenAPI document và gắn Swagger UI vào app.
 *
 * Tách khỏi main.ts để unit test tạo lại được đúng document đó, tránh việc
 * tài liệu bị lệch khỏi code mà không ai phát hiện.
 */
export function setupSwagger(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Sports Fields Booking API')
    .setDescription(
      [
        'API đặt sân thể thao (NestJS + Prisma + PostgreSQL).',
        '',
        'Cách thử nhanh: gọi `POST /auth/login` với tài khoản demo',
        '`customer@test.com` hoặc `owner@test.com` (mật khẩu `123456`), sau đó bấm',
        '**Authorize** và dán `access_token` để gọi các API cần đăng nhập.',
        '',
        'Chống trùng giờ được bảo vệ 2 lớp: service trả `409`, và PostgreSQL',
        '`EXCLUDE` constraint `booking_no_overlap` chặn mọi writer khác.',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Dán access_token nhận từ POST /auth/login',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      tagsSorter: 'alpha',
    },
  });

  return document;
}
