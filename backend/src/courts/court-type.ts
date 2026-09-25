/**
 * Key enum `SportType` của database (khớp `enum SportType` trong schema.prisma).
 *
 * Khai báo cục bộ (không import từ `@prisma/client`) để DTO/service không phụ
 * thuộc kiểu do Prisma client sinh ra — tránh ESLint báo "unsafe assignment of
 * an error typed value" / "unsafe member access" khi client chưa generate.
 */
export const COURT_TYPE_KEYS = [
  'FOOTBALL',
  'BADMINTON',
  'TENNIS',
  'PICKLEBALL',
  'BASKETBALL',
  'OTHER',
] as const;

export type CourtTypeKey = (typeof COURT_TYPE_KEYS)[number];

/**
 * Nhận giá trị lạ từ query string/body và trả về key hợp lệ, hoặc `undefined`
 * nếu không thuộc enum. Dùng để lọc ở database và chặn dữ liệu rác.
 */
export function toCourtTypeKey(value: unknown): CourtTypeKey | undefined {
  return COURT_TYPE_KEYS.find((key) => key === value);
}
