import { validateEnv } from './env.validation';

const baseEnv = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db?schema=public',
  DIRECT_URL: 'postgresql://user:pass@localhost:5432/db?schema=public',
  JWT_SECRET: 'a'.repeat(32),
};

describe('validateEnv', () => {
  it('nhận cấu hình hợp lệ và áp giá trị mặc định', () => {
    const env = validateEnv({ ...baseEnv });

    expect(env.PORT).toBe(3000);
    expect(env.NODE_ENV).toBe('development');
    expect(env.JWT_EXPIRES_IN).toBe('7d');
    expect(env.CORS_ORIGIN).toBe('http://localhost:3001');
    expect(env.SWAGGER_ENABLED).toBe('true');
    // Cấu hình ảnh sân: mặc định lưu ở đĩa, chưa bật Supabase Storage.
    expect(env.PUBLIC_BASE_URL).toBe('http://localhost:3000');
    expect(env.UPLOAD_MAX_BYTES).toBe(5 * 1024 * 1024);
    expect(env.SUPABASE_STORAGE_BUCKET).toBe('court-images');
    expect(env.SUPABASE_URL).toBeUndefined();
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
  });

  it('ép UPLOAD_MAX_BYTES từ chuỗi sang số và từ chối giá trị vô lý', () => {
    expect(
      validateEnv({ ...baseEnv, UPLOAD_MAX_BYTES: '2048' }).UPLOAD_MAX_BYTES,
    ).toBe(2048);
    expect(() => validateEnv({ ...baseEnv, UPLOAD_MAX_BYTES: 'abc' })).toThrow(
      /UPLOAD_MAX_BYTES/,
    );
    expect(() =>
      validateEnv({ ...baseEnv, UPLOAD_MAX_BYTES: '999999999' }),
    ).toThrow(/UPLOAD_MAX_BYTES/);
  });

  it('ép PORT từ chuỗi sang số', () => {
    expect(validateEnv({ ...baseEnv, PORT: '4000' }).PORT).toBe(4000);
  });

  it('từ chối khi thiếu biến bắt buộc', () => {
    expect(() => validateEnv({ ...baseEnv, DATABASE_URL: undefined })).toThrow(
      /DATABASE_URL/,
    );
    expect(() => validateEnv({ ...baseEnv, DIRECT_URL: undefined })).toThrow(
      /DIRECT_URL/,
    );
    expect(() => validateEnv({ ...baseEnv, JWT_SECRET: undefined })).toThrow(
      /JWT_SECRET/,
    );
  });

  it('từ chối JWT_SECRET ngắn hơn 32 ký tự', () => {
    expect(() => validateEnv({ ...baseEnv, JWT_SECRET: 'too-short' })).toThrow(
      /JWT_SECRET phải dài ít nhất 32 ký tự/,
    );
  });

  it('từ chối PORT và SWAGGER_ENABLED không hợp lệ', () => {
    expect(() => validateEnv({ ...baseEnv, PORT: 'abc' })).toThrow(/PORT/);
    expect(() => validateEnv({ ...baseEnv, PORT: '70000' })).toThrow(/PORT/);
    expect(() => validateEnv({ ...baseEnv, SWAGGER_ENABLED: 'yes' })).toThrow(
      /SWAGGER_ENABLED/,
    );
  });

  it('từ chối NODE_ENV lạ', () => {
    expect(() => validateEnv({ ...baseEnv, NODE_ENV: 'staging' })).toThrow(
      /NODE_ENV/,
    );
  });
});
