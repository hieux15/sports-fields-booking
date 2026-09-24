-- Ảnh thật của sân do chủ sân tải lên. Cột nullable nên bảng đang có dữ liệu
-- không cần backfill: sân cũ (imageUrl = NULL) vẫn hiển thị ảnh minh hoạ theo
-- loại sân ở phía client.
ALTER TABLE "Court" ADD COLUMN "imageUrl" TEXT;
