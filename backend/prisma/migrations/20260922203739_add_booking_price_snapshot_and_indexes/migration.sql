-- Bước 1: thêm 2 cột snapshot giá ở dạng nullable để bảng đang có data vẫn chạy được.
ALTER TABLE "Booking" ADD COLUMN "pricePerHour" DECIMAL(65,30);
ALTER TABLE "Booking" ADD COLUMN "totalPrice" DECIMAL(65,30);

-- Bước 2: backfill 28 đơn cũ bằng giá hiện tại của sân (ước tính tốt nhất cho dữ liệu
-- lịch sử đã có trước khi snapshot tồn tại) và tổng tiền theo thời lượng thật.
UPDATE "Booking" AS b
SET "pricePerHour" = c."pricePerHour",
    "totalPrice" = c."pricePerHour" * (
      EXTRACT(EPOCH FROM (b."endTime" - b."startTime")) / 3600
    )
FROM "Court" AS c
WHERE b."courtId" = c."id"
  AND b."pricePerHour" IS NULL;

-- Bước 3: giờ mới khoá cột bắt buộc.
ALTER TABLE "Booking" ALTER COLUMN "pricePerHour" SET NOT NULL;
ALTER TABLE "Booking" ALTER COLUMN "totalPrice" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Booking_userId_startTime_idx" ON "Booking"("userId", "startTime");

-- CreateIndex
CREATE INDEX "Court_ownerId_idx" ON "Court"("ownerId");
