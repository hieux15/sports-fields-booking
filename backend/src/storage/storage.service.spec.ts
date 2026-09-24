import { BadGatewayException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  StorageService,
  UPLOAD_ROOT_DIR,
  COURT_IMAGE_FOLDER,
} from './storage.service';
import { IMAGE_MIME_EXTENSIONS } from './image-upload';
import type { UploadedImageFile } from './image-upload';

const pngBuffer = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(16),
]);

const pngFile = (): UploadedImageFile => ({
  originalname: 'san.png',
  mimetype: 'image/png',
  size: pngBuffer.length,
  buffer: pngBuffer,
});

/** internalConfig của ConfigService được ưu tiên hơn process.env nên test tất định. */
const buildService = (env: Record<string, unknown> = {}) =>
  new StorageService(new ConfigService(env));

const filePathFromUrl = (imageUrl: string) =>
  join(
    process.cwd(),
    UPLOAD_ROOT_DIR,
    COURT_IMAGE_FOLDER,
    imageUrl.slice(imageUrl.lastIndexOf('/') + 1),
  );

const jsonResponse = (status: number, body = '') =>
  ({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(body),
  }) as Response;

describe('StorageService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('chọn driver theo cấu hình', () => {
    it('mặc định dùng ổ đĩa local khi chưa cấu hình Supabase', () => {
      const service = buildService();

      expect(service.driver).toBe('local');
      expect(service.maxUploadBytes).toBe(5 * 1024 * 1024);
      expect(service.allowedMimeTypes).toEqual(
        Object.keys(IMAGE_MIME_EXTENSIONS),
      );
    });

    it('chỉ chuyển sang Supabase khi có đủ URL và service role key', () => {
      expect(
        buildService({ SUPABASE_URL: 'https://xyz.supabase.co' }).driver,
      ).toBe('local');
      expect(buildService({ SUPABASE_SERVICE_ROLE_KEY: 'key' }).driver).toBe(
        'local',
      );
      expect(
        buildService({
          SUPABASE_URL: 'https://xyz.supabase.co',
          SUPABASE_SERVICE_ROLE_KEY: 'key',
        }).driver,
      ).toBe('supabase');
    });

    it('đọc được giới hạn dung lượng từ env', () => {
      expect(buildService({ UPLOAD_MAX_BYTES: '1024' }).maxUploadBytes).toBe(
        1024,
      );
    });
  });

  describe('driver local (backend/uploads)', () => {
    it('báo lỗi rõ ràng khi endpoint không nhận được file', async () => {
      const service = buildService();

      await expect(service.saveCourtImage()).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('ghi ảnh ra đĩa, trả URL công khai và xoá được file đó', async () => {
      const service = buildService({
        PUBLIC_BASE_URL: 'http://localhost:3000/',
      });

      const { imageUrl } = await service.saveCourtImage(pngFile());
      const fileName = imageUrl.slice(imageUrl.lastIndexOf('/') + 1);

      // Dấu "/" cuối PUBLIC_BASE_URL phải được cắt để URL không bị "//uploads".
      expect(imageUrl).toBe(
        `http://localhost:3000/${UPLOAD_ROOT_DIR}/${COURT_IMAGE_FOLDER}/${fileName}`,
      );
      expect(fileName).toMatch(/^[0-9a-f-]{36}\.png$/);

      const written = await readFile(filePathFromUrl(imageUrl));
      expect(written.equals(pngBuffer)).toBe(true);

      await service.removeCourtImage(imageUrl);
      await expect(access(filePathFromUrl(imageUrl))).rejects.toThrow();
    });

    it('bỏ qua URL không phải ảnh của mình thay vì xoá bừa file', async () => {
      const service = buildService();

      await expect(
        service.removeCourtImage('https://images.unsplash.com/photo-1'),
      ).resolves.toBeUndefined();
      await expect(service.removeCourtImage(null)).resolves.toBeUndefined();
    });

    it('từ chối ảnh sai định dạng trước khi ghi ra đĩa', async () => {
      const service = buildService();

      await expect(
        service.saveCourtImage({ ...pngFile(), mimetype: 'application/pdf' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('driver Supabase Storage (gọi REST API, không cần SDK)', () => {
    const supabaseEnv = {
      SUPABASE_URL: 'https://xyz.supabase.co/',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
      SUPABASE_STORAGE_BUCKET: 'court-images',
    };
    const publicPrefix =
      'https://xyz.supabase.co/storage/v1/object/public/court-images';

    it('upload bằng POST /storage/v1/object rồi trả URL public', async () => {
      const fetchMock = jest
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(jsonResponse(200));
      const service = buildService(supabaseEnv);

      const { imageUrl } = await service.saveCourtImage(pngFile());

      expect(imageUrl).toMatch(
        /^https:\/\/xyz\.supabase\.co\/storage\/v1\/object\/public\/court-images\/courts\/[0-9a-f-]{36}\.png$/,
      );

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(
        `https://xyz.supabase.co/storage/v1/object/court-images${imageUrl.slice(publicPrefix.length)}`,
      );
      expect(init).toMatchObject({
        method: 'POST',
        headers: {
          Authorization: 'Bearer service-role-key',
          apikey: 'service-role-key',
          'Content-Type': 'image/png',
          'x-upsert': 'false',
        },
      });
    });

    it('trả 502 khi Supabase từ chối upload', async () => {
      jest
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(jsonResponse(400, 'Bucket not found'));
      const service = buildService(supabaseEnv);

      await expect(service.saveCourtImage(pngFile())).rejects.toBeInstanceOf(
        BadGatewayException,
      );
    });

    it('xoá ảnh bằng DELETE và coi 404 là đã xoá xong', async () => {
      const fetchMock = jest.spyOn(globalThis, 'fetch');
      fetchMock.mockResolvedValueOnce(jsonResponse(200));
      const service = buildService(supabaseEnv);
      const { imageUrl } = await service.saveCourtImage(pngFile());

      fetchMock.mockResolvedValueOnce(jsonResponse(404, 'not found'));

      await expect(service.removeCourtImage(imageUrl)).resolves.toBeUndefined();
      expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'DELETE' });
    });

    it('không gọi Supabase khi URL thuộc bucket hoặc host khác', async () => {
      const fetchMock = jest
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(jsonResponse(200));
      const service = buildService(supabaseEnv);

      await service.removeCourtImage(
        'https://xyz.supabase.co/storage/v1/object/public/avatars/courts/a.png',
      );
      await service.removeCourtImage('https://images.unsplash.com/photo-1');
      await service.removeCourtImage(
        'http://localhost:9999/uploads/courts/a.png',
      );

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('nuốt lỗi khi xoá: dọn ảnh không được chặn việc xoá sân', async () => {
      const fetchMock = jest
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(jsonResponse(500, 'boom'));
      const service = buildService(supabaseEnv);

      await expect(
        service.removeCourtImage(
          'https://xyz.supabase.co/storage/v1/object/public/court-images/courts/00000000-0000-4000-8000-000000000000.png',
        ),
      ).resolves.toBeUndefined();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
