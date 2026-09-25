import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { OpenAPIObject } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { setupSwagger } from './swagger';

/**
 * Bảo vệ tài liệu OpenAPI khỏi bị lệch khỏi code: nếu ai đó xoá route, đổi tên
 * controller hoặc bỏ sót bearer auth thì test này fail ngay, thay vì phải mở
 * /docs mới phát hiện.
 */
describe('OpenAPI document', () => {
  let app: INestApplication;
  let document: OpenAPIObject;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Document chỉ đọc metadata của controller/DTO nên không cần database.
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    document = setupSwagger(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('mô tả đầy đủ các route được ghi trong README', () => {
    expect(Object.keys(document.paths)).toEqual(
      expect.arrayContaining([
        '/',
        '/health',
        '/auth/register',
        '/auth/login',
        '/users/me',
        '/courts',
        '/courts/me',
        '/courts/images',
        '/courts/{id}',
        '/courts/{id}/availability',
        '/courts/{id}/bookings',
        '/bookings',
        '/bookings/me',
        '/bookings/owner',
        '/bookings/{id}',
        '/bookings/{id}/cancel',
        '/bookings/{id}/confirm',
      ]),
    );
  });

  it('khai báo bearer auth và yêu cầu token ở các route cần đăng nhập', () => {
    expect(document.components?.securitySchemes).toHaveProperty('access-token');
    expect(document.paths['/users/me']?.get?.security).toEqual([
      { 'access-token': [] },
    ]);
    expect(document.paths['/bookings']?.post?.security).toEqual([
      { 'access-token': [] },
    ]);
    expect(document.paths['/bookings/owner']?.get?.security).toEqual([
      { 'access-token': [] },
    ]);
    expect(document.paths['/courts/{id}/bookings']?.get?.security).toEqual([
      { 'access-token': [] },
    ]);
  });

  it('không yêu cầu token ở các route public', () => {
    expect(document.paths['/auth/login']?.post?.security).toBeUndefined();
    expect(document.paths['/auth/register']?.post?.security).toBeUndefined();
    expect(document.paths['/courts']?.get?.security).toBeUndefined();
    expect(document.paths['/courts/{id}']?.get?.security).toBeUndefined();
  });

  it('khai báo route upload ảnh sân là multipart và yêu cầu token', () => {
    const upload = document.paths['/courts/images']?.post;

    expect(upload?.security).toEqual([{ 'access-token': [] }]);
    // Dùng dạng mảng để key chứa "/" và "-" không bị hiểu là đường dẫn lồng nhau.
    expect(upload?.requestBody).toHaveProperty([
      'content',
      'multipart/form-data',
    ]);
  });

  it('sinh schema body cho các DTO đầu vào', () => {
    const schemas = document.components?.schemas ?? {};
    expect(Object.keys(schemas)).toEqual(
      expect.arrayContaining([
        'LoginDto',
        'RegisterDto',
        'CreateCourtDto',
        'UpdateCourtDto',
        'CreateBookingDto',
        'UpdateMeDto',
        'LoginResponseDto',
      ]),
    );
    expect(document.paths['/bookings']?.post?.requestBody).toBeDefined();
    expect(document.paths['/courts']?.post?.requestBody).toBeDefined();
  });
});
