import { BadRequestException } from '@nestjs/common';

/** Định dạng 24h HH:mm, dùng cho Court.openTime và Court.closeTime. */
export const COURT_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export const MIN_PRICE_PER_HOUR = 10000;
export const MAX_PRICE_PER_HOUR = 10000000;

/**
 * Kiểm tra giờ mở/đóng cửa của sân. Dùng chung cho CourtsService và
 * UsersService (luồng become-owner cũng tạo sân nên phải kiểm tra y hệt).
 */
export function validateCourtSchedule(openTime: string, closeTime: string) {
  if (
    !COURT_TIME_PATTERN.test(openTime) ||
    !COURT_TIME_PATTERN.test(closeTime)
  ) {
    throw new BadRequestException(
      'Giờ mở cửa và giờ đóng cửa phải có định dạng HH:mm',
    );
  }
  if (openTime >= closeTime) {
    throw new BadRequestException('Giờ mở cửa phải trước giờ đóng cửa');
  }
}

/** Kiểm tra giá thuê mỗi giờ nằm trong khoảng hợp lý. */
export function validateCourtPrice(pricePerHour: number) {
  if (
    !Number.isFinite(pricePerHour) ||
    pricePerHour < MIN_PRICE_PER_HOUR ||
    pricePerHour > MAX_PRICE_PER_HOUR
  ) {
    throw new BadRequestException(
      `Giá sân phải từ ${MIN_PRICE_PER_HOUR.toLocaleString('vi-VN')} đến ${MAX_PRICE_PER_HOUR.toLocaleString('vi-VN')} đồng/giờ`,
    );
  }
}
