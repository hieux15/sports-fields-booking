import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { CourtsController } from './courts.controller';
import { CourtsService } from './courts.service';
import { CreateCourtDto } from './dto/create-court.dto';
import { QueryCourtsDto } from './dto/query-courts.dto';
import { StorageService } from '../storage/storage.service';
import type { UploadedImageFile } from '../storage/image-upload';

type RequestWithUser = Parameters<CourtsController['create']>[0];

const buildRequest = (id: string) =>
  ({
    user: { id, email: 'owner@example.com', role: Role.OWNER },
  }) as unknown as RequestWithUser;

describe('CourtsController', () => {
  let controller: CourtsController;
  const courtsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findMyCourts: jest.fn(),
    findOne: jest.fn(),
    updateMyCourt: jest.fn(),
    removeMyCourt: jest.fn(),
  };
  const storageService = {
    saveCourtImage: jest.fn(),
    removeCourtImage: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CourtsController],
      providers: [
        { provide: CourtsService, useValue: courtsService },
        { provide: StorageService, useValue: storageService },
      ],
    }).compile();

    controller = module.get<CourtsController>(CourtsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('ủy quyền tạo sân cho service với id chủ sân', async () => {
    const dto: CreateCourtDto = {
      name: 'Sân A',
      type: 'FOOTBALL',
      pricePerHour: 200000,
      openTime: '06:00',
      closeTime: '22:00',
    };

    await controller.create(buildRequest('owner-1'), dto);

    expect(courtsService.create).toHaveBeenCalledWith(dto, 'owner-1');
  });

  it('ủy quyền lấy danh sách sân cho service kèm query phân trang', async () => {
    const query = new QueryCourtsDto();
    query.q = 'cầu giấy';
    query.page = 2;

    await controller.findAll(query);

    expect(courtsService.findAll).toHaveBeenCalledWith(query);
  });

  it('ủy quyền lấy chi tiết sân cho service', async () => {
    await controller.findOne('court-1');

    expect(courtsService.findOne).toHaveBeenCalledWith('court-1');
  });

  it('ủy quyền lấy sân của tôi cho service với id chủ sân', async () => {
    await controller.findMine(buildRequest('owner-1'));

    expect(courtsService.findMyCourts).toHaveBeenCalledWith('owner-1');
  });

  it('ủy quyền cập nhật sân cho service với id sân và id chủ sân', async () => {
    await controller.update(
      'court-1',
      { name: 'Sân B' },
      buildRequest('owner-1'),
    );

    expect(courtsService.updateMyCourt).toHaveBeenCalledWith(
      'court-1',
      'owner-1',
      { name: 'Sân B' },
    );
  });

  it('ủy quyền xóa sân cho service với id sân và id chủ sân', async () => {
    await controller.remove('court-1', buildRequest('owner-1'));

    expect(courtsService.removeMyCourt).toHaveBeenCalledWith(
      'court-1',
      'owner-1',
    );
  });

  it('ủy quyền lưu ảnh sân cho StorageService và trả về URL', async () => {
    const file: UploadedImageFile = {
      originalname: 'san-bong-da.png',
      mimetype: 'image/png',
      size: 2048,
      buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    };
    storageService.saveCourtImage.mockResolvedValue({
      imageUrl: '/uploads/courts/a1b2.png',
    });

    await expect(controller.uploadImage(file)).resolves.toEqual({
      imageUrl: '/uploads/courts/a1b2.png',
    });
    expect(storageService.saveCourtImage).toHaveBeenCalledWith(file);
  });
});
