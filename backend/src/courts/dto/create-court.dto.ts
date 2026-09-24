import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  COURT_TIME_PATTERN,
  MAX_PRICE_PER_HOUR,
  MIN_PRICE_PER_HOUR,
} from '../court-validation';

export class CreateCourtDto {
  @ApiProperty({ example: 'Sân bóng đá Mini Cầu Giấy 1', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty({
    example: 'Bóng đá',
    description:
      'Loại sân: Bóng đá, Cầu lông, Tennis, Pickleball, Bóng rổ, Khác',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  type!: string;

  @ApiPropertyOptional({
    example: 'Cầu Giấy, Hà Nội',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({
    example:
      'https://xyz.supabase.co/storage/v1/object/public/court-images/courts/a1b2.webp',
    description:
      'URL ảnh sân trả về từ POST /courts/images (http(s) hoặc /uploads/...); gửi null để xoá ảnh khi cập nhật',
    maxLength: 2048,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @MaxLength(2048)
  @Matches(/^(https?:\/\/|\/)[^\s]*$/i, {
    message: 'Ảnh sân phải là URL http(s) hoặc đường dẫn bắt đầu bằng "/"',
  })
  imageUrl?: string | null;

  // HTML number inputs submit strings, so coerce before validating.
  @ApiProperty({
    example: 200000,
    description: 'Giá thuê mỗi giờ (VND)',
    minimum: MIN_PRICE_PER_HOUR,
    maximum: MAX_PRICE_PER_HOUR,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(MIN_PRICE_PER_HOUR)
  @Max(MAX_PRICE_PER_HOUR)
  pricePerHour!: number;

  @ApiProperty({
    example: '06:00',
    description: 'Giờ mở cửa, định dạng HH:mm',
  })
  @Matches(COURT_TIME_PATTERN, {
    message: 'Giờ mở cửa phải có định dạng HH:mm',
  })
  openTime!: string;

  @ApiProperty({
    example: '22:00',
    description: 'Giờ đóng cửa, định dạng HH:mm',
  })
  @Matches(COURT_TIME_PATTERN, {
    message: 'Giờ đóng cửa phải có định dạng HH:mm',
  })
  closeTime!: string;
}
