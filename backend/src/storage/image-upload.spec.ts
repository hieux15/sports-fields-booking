import { BadRequestException } from '@nestjs/common';
import {
  detectImageExtension,
  isAllowedImageMime,
  validateImageUpload,
  type UploadedImageFile,
} from './image-upload';

const pngBuffer = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(16),
]);
const jpegBuffer = Buffer.concat([
  Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
  Buffer.alloc(16),
]);
const gifBuffer = Buffer.from(`GIF89a${'x'.repeat(16)}`);
const webpBuffer = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.alloc(4),
  Buffer.from('WEBP'),
]);
const avifBuffer = Buffer.concat([
  Buffer.alloc(4),
  Buffer.from('ftypavif'),
  Buffer.alloc(8),
]);

const upload = (
  overrides: Partial<UploadedImageFile> = {},
): UploadedImageFile => ({
  originalname: 'san.png',
  mimetype: 'image/png',
  size: pngBuffer.length,
  buffer: pngBuffer,
  ...overrides,
});

describe('validateImageUpload', () => {
  it('nhận ảnh hợp lệ và trả về đuôi file để đặt tên trên storage', () => {
    expect(validateImageUpload(upload(), 1024 * 1024)).toEqual({
      extension: 'png',
    });
    expect(
      validateImageUpload(
        upload({ mimetype: 'image/jpeg', buffer: jpegBuffer }),
        1024 * 1024,
      ),
    ).toEqual({ extension: 'jpg' });
    expect(
      validateImageUpload(
        upload({ mimetype: 'image/gif', buffer: gifBuffer }),
        1024 * 1024,
      ),
    ).toEqual({ extension: 'gif' });
    expect(
      validateImageUpload(
        upload({ mimetype: 'image/webp', buffer: webpBuffer }),
        1024 * 1024,
      ),
    ).toEqual({ extension: 'webp' });
    expect(
      validateImageUpload(
        upload({ mimetype: 'image/avif', buffer: avifBuffer }),
        1024 * 1024,
      ),
    ).toEqual({ extension: 'avif' });
  });

  it('báo lỗi khi thiếu file', () => {
    expect(() => validateImageUpload(undefined, 1024)).toThrow(
      /Vui lòng chọn file ảnh/,
    );
    expect(() =>
      validateImageUpload(upload({ buffer: Buffer.alloc(0) }), 1024),
    ).toThrow(BadRequestException);
  });

  it('chặn định dạng không nằm trong whitelist (kể cả SVG)', () => {
    expect(() =>
      validateImageUpload(upload({ mimetype: 'application/pdf' }), 1024),
    ).toThrow(/Chỉ nhận ảnh/);
    expect(() =>
      validateImageUpload(upload({ mimetype: 'image/svg+xml' }), 1024),
    ).toThrow(/Chỉ nhận ảnh/);
  });

  it('chặn ảnh vượt dung lượng cho phép', () => {
    expect(() =>
      validateImageUpload(upload({ size: 6 * 1024 * 1024 }), 5 * 1024 * 1024),
    ).toThrow(/không được lớn hơn 5MB/);
  });

  it('chặn file giả dạng ảnh: nội dung không khớp MIME khai báo', () => {
    expect(() =>
      validateImageUpload(
        upload({ mimetype: 'image/png', buffer: gifBuffer }),
        1024 * 1024,
      ),
    ).toThrow(/không khớp với định dạng ảnh/);
    expect(() =>
      validateImageUpload(
        upload({
          mimetype: 'image/png',
          buffer: Buffer.from('<html>not an image</html>'),
        }),
        1024 * 1024,
      ),
    ).toThrow(/không phải là ảnh hợp lệ/);
  });
});

describe('isAllowedImageMime', () => {
  it('nhận đúng các MIME ảnh được hỗ trợ, phân biệt hoa thường', () => {
    expect(isAllowedImageMime('image/png')).toBe(true);
    expect(isAllowedImageMime('IMAGE/WEBP')).toBe(true);
    expect(isAllowedImageMime('image/svg+xml')).toBe(false);
    expect(isAllowedImageMime('text/html')).toBe(false);
  });
});

describe('detectImageExtension', () => {
  it('nhận diện theo chữ ký nhị phân và trả null với dữ liệu lạ', () => {
    expect(detectImageExtension(pngBuffer)).toBe('png');
    expect(detectImageExtension(jpegBuffer)).toBe('jpg');
    expect(detectImageExtension(gifBuffer)).toBe('gif');
    expect(detectImageExtension(webpBuffer)).toBe('webp');
    expect(detectImageExtension(avifBuffer)).toBe('avif');
    expect(detectImageExtension(Buffer.alloc(4))).toBeNull();
    expect(detectImageExtension(Buffer.from('hello world!'))).toBeNull();
  });
});
