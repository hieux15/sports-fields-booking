import { BadRequestException } from '@nestjs/common';

/**
 * Tập định dạng ảnh được phép upload, kèm đuôi file dùng để đặt tên trên
 * storage. Cố tình không nhận SVG: SVG là XML nên có thể chứa script, và ảnh
 * được phục vụ từ chính domain của API.
 */
export const IMAGE_MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
};

export const ALLOWED_IMAGE_MIME_TYPES = Object.keys(IMAGE_MIME_EXTENSIONS);

/** Mặc định mỗi ảnh tối đa 5MB khi `UPLOAD_MAX_BYTES` không được đặt. */
export const DEFAULT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/**
 * Mức trần dung lượng ảnh, cũng là `@Max` của `UPLOAD_MAX_BYTES`. Multer dùng
 * giá trị này làm giới hạn cứng (để không đọc file khổng lồ vào RAM), còn hạn
 * mức thật đang cấu hình do StorageService kiểm tra và báo lỗi tiếng Việt.
 */
export const MAX_IMAGE_BYTES_LIMIT = 20 * 1024 * 1024;

/**
 * Hình dạng tối thiểu của file multer (memory storage) mà service cần.
 * Khai báo tại đây thay vì dùng `Express.Multer.File` để dự án không phải thêm
 * phụ thuộc `@types/multer`.
 */
export interface UploadedImageFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/** Đuôi file suy ra từ chữ ký nhị phân (magic bytes) của nội dung file. */
export function detectImageExtension(buffer: Buffer): string | null {
  if (!buffer || buffer.length < 12) {
    return null;
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'png';
  }

  const header = buffer.toString('ascii', 0, 4);
  const brand = buffer.toString('ascii', 4, 12);

  // GIF: "GIF87a" hoặc "GIF89a"
  if (header === 'GIF8') {
    return 'gif';
  }

  // WebP: "RIFF....WEBP"
  if (header === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'webp';
  }

  // AVIF / HEIF-kiểu AVIF: "....ftypavif" (hoặc avis, mif1)
  if (brand.startsWith('ftypav')) {
    return 'avif';
  }

  return null;
}

/** Dùng cho `fileFilter` của multer: chặn sớm theo MIME trước khi đọc hết file. */
export function isAllowedImageMime(mimetype: string): boolean {
  // `Object.hasOwn` thay vì `hasOwnProperty.call`: tsconfig tắt
  // strictBindCallApply nên `.call` trả về `any`, còn cách này luôn là boolean.
  return Object.hasOwn(IMAGE_MIME_EXTENSIONS, mimetype.toLowerCase());
}

/**
 * Kiểm tra file upload trước khi ghi lên storage: dung lượng, MIME khai báo và
 * chữ ký nhị phân phải khớp nhau. Nhờ bước so khớp cuối, kẻ tấn công không thể
 * đổi tên một file HTML/script thành `.png` rồi để API phục vụ nó như ảnh.
 */
export function validateImageUpload(
  file: UploadedImageFile | undefined,
  maxBytes: number,
): { extension: string } {
  if (!file || !file.buffer?.length) {
    throw new BadRequestException('Vui lòng chọn file ảnh để tải lên');
  }

  const mimetype = file.mimetype?.toLowerCase() ?? '';
  const declaredExtension = IMAGE_MIME_EXTENSIONS[mimetype];
  if (!declaredExtension) {
    throw new BadRequestException(
      `Chỉ nhận ảnh ${ALLOWED_IMAGE_MIME_TYPES.join(', ')}`,
    );
  }

  if (file.size > maxBytes || file.buffer.length > maxBytes) {
    throw new BadRequestException(
      `Ảnh không được lớn hơn ${Math.round(maxBytes / (1024 * 1024))}MB`,
    );
  }

  const detectedExtension = detectImageExtension(file.buffer);
  if (!detectedExtension) {
    throw new BadRequestException(
      'File tải lên không phải là ảnh hợp lệ (jpg, png, webp, avif, gif)',
    );
  }

  // Đuôi file trong bảng MIME phải trùng với định dạng nhận diện từ nội dung:
  // nhờ vậy không thể đổi tên một file khác định dạng thành `.png`.
  if (declaredExtension !== detectedExtension) {
    throw new BadRequestException(
      'Nội dung file không khớp với định dạng ảnh đã khai báo',
    );
  }

  return { extension: detectedExtension };
}
