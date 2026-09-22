import { plainToInstance, Type } from 'class-transformer';
import {
  IsBooleanString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

/**
 * Khai báo mọi biến môi trường mà app cần. Dùng class-validator sẵn có của dự án
 * (thay vì thêm Joi) để giữ một cách validate duy nhất cho cả DTO và config.
 */
export class EnvironmentVariables {
  @IsOptional()
  @IsIn(['development', 'test', 'production'])
  NODE_ENV: string = 'development';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  DIRECT_URL!: string;

  @IsString()
  @MinLength(32, {
    message: 'JWT_SECRET phải dài ít nhất 32 ký tự',
  })
  JWT_SECRET!: string;

  @IsOptional()
  @IsString()
  JWT_EXPIRES_IN: string = '7d';

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  CORS_ORIGIN: string = 'http://localhost:3001';

  @IsOptional()
  @IsBooleanString()
  SWAGGER_ENABLED: string = 'true';
}

/**
 * Fail fast: app không khởi động nếu thiếu biến bắt buộc hoặc JWT_SECRET quá
 * ngắn, thay vì chạy với `process.env.JWT_SECRET === undefined`.
 */
export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config);
  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const details = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('\n');
    throw new Error(`Cấu hình biến môi trường không hợp lệ:\n${details}`);
  }

  return validated;
}
