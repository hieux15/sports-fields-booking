import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  DEFAULT_IMAGE_MAX_BYTES,
  validateImageUpload,
} from './image-upload';
import type { UploadedImageFile } from './image-upload';

/** Thư mục gốc chứa file upload khi chạy driver local (được phục vụ ở /uploads). */
export const UPLOAD_ROOT_DIR = 'uploads';
/** Gốc lưu ảnh tuyệt đối theo thư mục backend (không phụ thuộc cwd khi chạy). */
export const UPLOAD_ROOT_PATH = join(__dirname, '..', UPLOAD_ROOT_DIR);
/** Thư mục con cho ảnh sân, cũng là tiền tố object trên Supabase Storage. */
export const COURT_IMAGE_FOLDER = 'courts';

/** Chỉ dọn ảnh có đúng tên UUID và đuôi do API sinh ra. */
const COURT_IMAGE_FILE_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp|avif|gif)$/;

export type StorageDriver = 'supabase' | 'local';

type SupabaseStorageConfig = {
  url: string;
  serviceRoleKey: string;
  bucket: string;
};

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly maxBytes: number;
  private readonly publicBaseUrl: string;
  private readonly supabase?: SupabaseStorageConfig;

  constructor(config: ConfigService) {
    this.maxBytes = Number(
      config.get('UPLOAD_MAX_BYTES') ?? DEFAULT_IMAGE_MAX_BYTES,
    );
    this.publicBaseUrl = (
      config.get<string>('PUBLIC_BASE_URL') ?? 'http://localhost:3000'
    ).replace(/\/+$/, '');

    const url = config.get<string>('SUPABASE_URL')?.trim();
    const serviceRoleKey = config
      .get<string>('SUPABASE_SERVICE_ROLE_KEY')
      ?.trim();

    this.supabase =
      url && serviceRoleKey
        ? {
            url: url.replace(/\/+$/, ''),
            serviceRoleKey,
            bucket:
              config.get<string>('SUPABASE_STORAGE_BUCKET')?.trim() ||
              'court-images',
          }
        : undefined;
  }

  /** Driver đang hoạt động, hữu ích cho log lúc khởi động và cho test. */
  get driver(): StorageDriver {
    return this.supabase ? 'supabase' : 'local';
  }

  /** Giới hạn dung lượng mỗi ảnh, controller truyền vào `limits.fileSize`. */
  get maxUploadBytes(): number {
    return this.maxBytes;
  }

  get allowedMimeTypes(): string[] {
    return [...ALLOWED_IMAGE_MIME_TYPES];
  }

  async saveCourtImage(
    file?: UploadedImageFile,
  ): Promise<{ imageUrl: string }> {
    // Ném 400 với thông báo tiếng Việt trước khi ghi bất cứ thứ gì.
    const { extension } = validateImageUpload(file, this.maxBytes);
    // `validateImageUpload` chỉ trả về sau khi đã bảo đảm file có buffer hợp lệ.
    const imageFile = file as UploadedImageFile;
    const fileName = `${randomUUID()}.${extension}`;
    const objectPath = `${COURT_IMAGE_FOLDER}/${fileName}`;

    if (this.supabase) {
      return this.saveToSupabase(imageFile, objectPath);
    }

    return this.saveToDisk(imageFile, fileName);
  }

  async removeCourtImage(imageUrl?: string | null): Promise<void> {
    if (!imageUrl) {
      return;
    }

    try {
      const objectPath = this.supabase
        ? this.toSupabaseObjectPath(imageUrl)
        : null;

      if (objectPath && this.supabase) {
        await this.deleteFromSupabase(objectPath);
        return;
      }

      const filePath = this.toLocalFilePath(imageUrl);
      if (filePath) {
        await unlink(filePath);
      }
    } catch (error) {
      this.logger.warn(
        `Không xoá được ảnh sân ${imageUrl}: ${(error as Error).message}`,
      );
    }
  }

  private get localDir(): string {
    return join(process.cwd(), UPLOAD_ROOT_DIR, COURT_IMAGE_FOLDER);
  }

  private async saveToDisk(file: UploadedImageFile, fileName: string) {
    const dir = this.localDir;
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, fileName), file.buffer);

    return {
      imageUrl: `${this.publicBaseUrl}/${UPLOAD_ROOT_DIR}/${COURT_IMAGE_FOLDER}/${fileName}`,
    };
  }

  private async saveToSupabase(file: UploadedImageFile, objectPath: string) {
    const config = this.supabase!;
    const response = await fetch(
      `${config.url}/storage/v1/object/${config.bucket}/${objectPath}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.serviceRoleKey}`,
          apikey: config.serviceRoleKey,
          'Content-Type': file.mimetype,
          // Ảnh là bất biến (tên file là UUID) nên cache vĩnh viễn ở CDN.
          'Cache-Control': 'public, max-age=31536000, immutable',
          'x-upsert': 'false',
        },
        body: new Uint8Array(file.buffer),
      },
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      this.logger.error(
        `Supabase Storage từ chối upload (${response.status}): ${detail}`,
      );
      throw new BadGatewayException(
        'Không lưu được ảnh lên Supabase Storage, vui lòng thử lại',
      );
    }

    return {
      imageUrl: `${config.url}/storage/v1/object/public/${config.bucket}/${objectPath}`,
    };
  }

  private async deleteFromSupabase(objectPath: string) {
    const config = this.supabase!;
    const response = await fetch(
      `${config.url}/storage/v1/object/${config.bucket}/${objectPath}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${config.serviceRoleKey}`,
          apikey: config.serviceRoleKey,
        },
      },
    );

    // 404: ảnh đã bị xoá trước đó, coi như xong.
    if (!response.ok && response.status !== 404) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Supabase trả ${response.status}: ${detail}`);
    }
  }

  /** Chỉ nhận object đúng thư mục `courts` và tên UUID do API tạo. */
  private toSupabaseObjectPath(imageUrl: string): string | null {
    if (!this.supabase) {
      return null;
    }

    const prefix = `${this.supabase.url}/storage/v1/object/public/${this.supabase.bucket}/`;
    if (!imageUrl.startsWith(prefix)) {
      return null;
    }

    const objectPath = imageUrl.slice(prefix.length);
    if (!objectPath.startsWith(`${COURT_IMAGE_FOLDER}/`)) {
      return null;
    }

    const fileName = objectPath.slice(COURT_IMAGE_FOLDER.length + 1);
    return COURT_IMAGE_FILE_PATTERN.test(fileName)
      ? `${COURT_IMAGE_FOLDER}/${fileName}`
      : null;
  }

  /** Đổi URL ảnh local thành đường dẫn file trên đĩa, null nếu không phải ảnh của API. */
  private toLocalFilePath(imageUrl: string): string | null {
    const relativePrefix = `/${UPLOAD_ROOT_DIR}/${COURT_IMAGE_FOLDER}/`;
    const absolutePrefix = `${this.publicBaseUrl}${relativePrefix}`;

    if (
      !imageUrl.startsWith(relativePrefix) &&
      !imageUrl.startsWith(absolutePrefix)
    ) {
      return null;
    }

    const fileName = imageUrl.slice(imageUrl.lastIndexOf('/') + 1);
    if (!COURT_IMAGE_FILE_PATTERN.test(fileName)) {
      return null;
    }

    return join(this.localDir, fileName);
  }
}
