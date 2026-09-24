-- Thêm trạng thái mới: EXPIRED (PENDING quá giờ bắt đầu) và COMPLETED (CONFIRMED
-- đã qua giờ kết thúc). Tách riêng khỏi migration dựng lại ràng buộc chống trùng
-- giờ vì Prisma chạy mỗi migration trong một transaction, và PostgreSQL không
-- cho dùng giá trị enum vừa thêm trong cùng transaction.
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';