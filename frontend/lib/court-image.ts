/**
 * Ràng buộc ảnh sân ở phía client cho phản hồi tức thì; phải khớp với
 * `DEFAULT_IMAGE_MAX_BYTES` trong `backend/src/storage/image-upload.ts`.
 * API vẫn là nơi quyết định (env `UPLOAD_MAX_BYTES`), nên nếu deployment nới
 * hạn mức thì client chỉ đơn giản là chặn sớm hơn.
 */
export const MAX_COURT_IMAGE_BYTES = 5 * 1024 * 1024

export const COURT_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/avif,image/gif'

const ALLOWED_TYPES = COURT_IMAGE_ACCEPT.split(',')

/** Trả về thông báo lỗi tiếng Việt, hoặc null khi file hợp lệ. */
export function validateCourtImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Chỉ nhận ảnh JPG, PNG, WEBP, AVIF hoặc GIF'
  }
  if (file.size > MAX_COURT_IMAGE_BYTES) {
    return `Ảnh không được lớn hơn ${MAX_COURT_IMAGE_BYTES / (1024 * 1024)}MB`
  }
  return null
}

/**
 * Chỉ đưa ảnh qua optimizer của Next khi URL thuộc host đã khai báo trong
 * `next.config.mjs`. DTO cho phép thêm ảnh từ CDN khác; dùng `unoptimized` cho
 * URL đó vẫn giữ layout của `next/image` mà không làm request ảnh hỏng.
 */
export function canOptimizeCourtImage(src: string): boolean {
  if (!src.startsWith('https://')) {
    return false
  }
  try {
    const { hostname } = new URL(src)
    return hostname === 'images.unsplash.com' || hostname.endsWith('.supabase.co')
  } catch {
    return false
  }
}
