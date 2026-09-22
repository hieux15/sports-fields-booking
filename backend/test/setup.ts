// Setup dùng chung cho unit test (jest `setupFiles`).
//
// 1. `reflect-metadata` cho metadata của decorator (class-validator,
//    class-transformer, Nest); các file test chỉ import decorator mà không qua
//    @nestjs/core sẽ lỗi "Reflect.getMetadata is not a function" nếu thiếu.
// 2. Biến môi trường: dùng .env nếu có, máy mới clone chưa cấu hình gì vẫn chạy
//    được `npm test` nhờ giá trị giả dưới đây (unit test đều mock PrismaService).
import 'reflect-metadata';
import 'dotenv/config';

const dummyDatabaseUrl =
  'postgresql://test:test@localhost:5432/test?schema=public';

process.env.DATABASE_URL ??= dummyDatabaseUrl;
process.env.DIRECT_URL ??= dummyDatabaseUrl;
process.env.JWT_SECRET ??= 'test-only-jwt-secret-with-at-least-32-chars';
