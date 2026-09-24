-- Đơn EXPIRED không được giữ chỗ nữa: gỡ và dựng lại ràng buộc loại trừ với
-- WHERE rộng hơn để slot của đơn hết hạn có thể được đặt lại.
ALTER TABLE "Booking" DROP CONSTRAINT "booking_no_overlap";

ALTER TABLE "Booking"
  ADD CONSTRAINT "booking_no_overlap"
  EXCLUDE USING gist (
    "courtId" WITH =,
    tsrange("startTime", "endTime", '[)') WITH &&
  )
  WHERE ("status" NOT IN ('CANCELLED', 'EXPIRED'));