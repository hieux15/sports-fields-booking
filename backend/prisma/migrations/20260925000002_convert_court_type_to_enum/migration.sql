CREATE TYPE "SportType" AS ENUM (
  'FOOTBALL',
  'BADMINTON',
  'TENNIS',
  'PICKLEBALL',
  'BASKETBALL',
  'OTHER'
);

-- Chuyển cột text tự do sang enum: map mọi biến thể đã thấy (chữ hoa/thường,
-- có/không dấu) về key ổn định; giá trị lạ rơi về OTHER nên migration không bao giờ fail.
ALTER TABLE "Court"
  ALTER COLUMN "type" TYPE "SportType"
  USING (
    CASE
      WHEN lower(btrim("type")) IN (
        'bóng đá', 'bong da', 'bóng đá mini', 'bong da mini',
        'sân bóng', 'san bong', 'football', 'soccer'
      ) THEN 'FOOTBALL'
      WHEN lower(btrim("type")) IN ('cầu lông', 'cau long', 'badminton') THEN 'BADMINTON'
      WHEN lower(btrim("type")) IN ('tennis') THEN 'TENNIS'
      WHEN lower(btrim("type")) IN ('pickleball') THEN 'PICKLEBALL'
      WHEN lower(btrim("type")) IN ('bóng rổ', 'bong ro', 'basketball') THEN 'BASKETBALL'
      WHEN lower(btrim("type")) IN ('khác', 'khac', 'other') THEN 'OTHER'
      ELSE 'OTHER'
    END
  )::"SportType";