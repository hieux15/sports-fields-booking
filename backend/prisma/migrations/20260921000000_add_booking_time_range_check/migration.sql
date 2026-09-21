-- Ràng buộc khoảng thời gian hợp lệ ở tầng database.
-- Dữ liệu hiện tại đã được kiểm tra: không có bản ghi nào có startTime >= endTime.
ALTER TABLE "Booking"
  ADD CONSTRAINT "booking_time_range_valid"
  CHECK ("startTime" < "endTime");
