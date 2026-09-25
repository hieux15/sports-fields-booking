import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { COURT_TYPE_KEYS } from '../court-type';
import type { CourtTypeKey } from '../court-type';

export const COURT_SORT_OPTIONS = [
  'name_asc',
  'name_desc',
  'price_asc',
  'price_desc',
] as const;

export type CourtSort = (typeof COURT_SORT_OPTIONS)[number];

export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 50;

/** Query string của `GET /courts`: tìm kiếm, lọc, sắp xếp và phân trang. */
export class QueryCourtsDto {
  @ApiPropertyOptional({
    description: 'Từ khóa tìm theo tên hoặc địa chỉ sân',
    example: 'cầu giấy',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo loại sân — đúng một giá trị enum SportType',
    enum: COURT_TYPE_KEYS,
    example: 'FOOTBALL',
  })
  @IsOptional()
  @IsIn(COURT_TYPE_KEYS)
  type?: CourtTypeKey;

  @ApiPropertyOptional({
    description: 'Giá thuê tối thiểu (VND/giờ)',
    example: 100000,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Giá thuê tối đa (VND/giờ)',
    example: 300000,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Trang cần lấy, bắt đầu từ 1',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Số sân mỗi trang',
    default: DEFAULT_PAGE_SIZE,
    minimum: 1,
    maximum: MAX_PAGE_SIZE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit: number = DEFAULT_PAGE_SIZE;

  @ApiPropertyOptional({
    description: 'Thứ tự sắp xếp',
    enum: COURT_SORT_OPTIONS,
    default: 'name_asc',
  })
  @IsOptional()
  @IsIn(COURT_SORT_OPTIONS)
  sort: CourtSort = 'name_asc';
}
