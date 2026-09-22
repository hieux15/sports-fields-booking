import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CourtsService } from './courts.service';
import { PrismaService } from '../prisma/prisma.service';
import { QueryCourtsDto } from './dto/query-courts.dto';

describe('CourtsService', () => {
  let service: CourtsService;
  const prisma = {
    court: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    booking: {
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  // $transaction chạy callback với chính mock prisma để test được các lệnh bên trong;
  // dạng mảng (findMany + count trong một transaction) thì chạy song song như Prisma.
  prisma.$transaction.mockImplementation(
    (input: ((tx: unknown) => Promise<unknown>) | Promise<unknown>[]) =>
      Array.isArray(input) ? Promise.all(input) : input(prisma),
  );

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [CourtsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<CourtsService>(CourtsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('chặn giờ mở cửa không đứng trước giờ đóng cửa', () => {
    expect(() =>
      service.create(
        {
          name: 'Sân A',
          type: 'Bóng đá',
          pricePerHour: 200000,
          openTime: '22:00',
          closeTime: '06:00',
        },
        'owner-1',
      ),
    ).toThrow(BadRequestException);
    expect(prisma.court.create).not.toHaveBeenCalled();
  });

  it('chặn giá sân ngoài khoảng hợp lý', () => {
    expect(() =>
      service.create(
        {
          name: 'Sân A',
          type: 'Bóng đá',
          pricePerHour: 5000,
          openTime: '06:00',
          closeTime: '22:00',
        },
        'owner-1',
      ),
    ).toThrow(BadRequestException);
    expect(prisma.court.create).not.toHaveBeenCalled();
  });

  it('kiểm tra lại giờ và giá khi cập nhật sân', async () => {
    prisma.court.findUnique.mockResolvedValue({
      id: 'court-1',
      ownerId: 'owner-1',
      openTime: '06:00',
      closeTime: '22:00',
      pricePerHour: 200000,
    });

    await expect(
      service.updateMyCourt('court-1', 'owner-1', { closeTime: '05:00' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.court.update).not.toHaveBeenCalled();
  });

  it('báo lỗi khi sân không tồn tại', async () => {
    prisma.court.findUnique.mockResolvedValue(null);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('báo lỗi khi cập nhật sân của người khác', async () => {
    prisma.court.findUnique.mockResolvedValue(null);

    await expect(
      service.updateMyCourt('court-1', 'user-2', {}),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('báo lỗi khi xóa sân của người khác', async () => {
    prisma.court.findUnique.mockResolvedValue(null);

    await expect(
      service.removeMyCourt('court-1', 'user-2'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('chỉ lấy sân của chủ sân đang đăng nhập', async () => {
    prisma.court.findMany.mockResolvedValue([]);

    await service.findMyCourts('owner-1');

    expect(prisma.court.findMany).toHaveBeenCalledWith({
      where: { ownerId: 'owner-1' },
      orderBy: { name: 'asc' },
    });
  });

  it('chặn xóa sân khi vẫn còn đơn đặt sân chưa hủy', async () => {
    prisma.court.findUnique.mockResolvedValue({ id: 'court-1', name: 'Sân A' });
    prisma.booking.count.mockResolvedValue(2);

    await expect(
      service.removeMyCourt('court-1', 'owner-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.court.delete).not.toHaveBeenCalled();
  });

  it('xóa sân kèm các đơn đã hủy khi không còn đơn chưa hủy', async () => {
    prisma.court.findUnique.mockResolvedValue({ id: 'court-1', name: 'Sân A' });
    prisma.booking.count.mockResolvedValue(0);

    const result = await service.removeMyCourt('court-1', 'owner-1');

    expect(prisma.booking.deleteMany).toHaveBeenCalledWith({
      where: { courtId: 'court-1', status: 'CANCELLED' },
    });
    expect(prisma.court.delete).toHaveBeenCalledWith({
      where: { id: 'court-1' },
    });
    expect(result).toEqual({
      success: true,
      message: 'Xóa thành công sân thể thao "Sân A"',
    });
  });

  describe('findAll (tìm kiếm + lọc + phân trang ở database)', () => {
    const query = (overrides: Partial<QueryCourtsDto> = {}) =>
      Object.assign(new QueryCourtsDto(), overrides);

    it('mặc định lấy trang 1, 12 sân, sắp theo tên và đếm trong cùng transaction', async () => {
      prisma.court.findMany.mockResolvedValue([]);
      prisma.court.count.mockResolvedValue(0);

      const result = await service.findAll(query());

      expect(prisma.court.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: 0,
        take: 12,
      });
      expect(prisma.court.count).toHaveBeenCalledWith({ where: {} });
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        items: [],
        total: 0,
        page: 1,
        limit: 12,
        totalPages: 1,
      });
    });

    it('đẩy từ khóa, loại sân và khoảng giá xuống WHERE của database', async () => {
      prisma.court.findMany.mockResolvedValue([]);
      prisma.court.count.mockResolvedValue(0);

      await service.findAll(
        query({
          q: '  cầu giấy ',
          type: 'Bóng đá',
          minPrice: 100000,
          maxPrice: 300000,
        }),
      );

      expect(prisma.court.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'cầu giấy', mode: 'insensitive' } },
              { address: { contains: 'cầu giấy', mode: 'insensitive' } },
            ],
            type: { equals: 'Bóng đá', mode: 'insensitive' },
            pricePerHour: { gte: 100000, lte: 300000 },
          },
        }),
      );
    });

    it('bỏ qua tham số rỗng và tính đúng skip/totalPages', async () => {
      prisma.court.findMany.mockResolvedValue([]);
      prisma.court.count.mockResolvedValue(25);

      const result = await service.findAll(
        query({
          q: '   ',
          type: '  ',
          page: 3,
          limit: 10,
          sort: 'price_desc',
        }),
      );

      expect(prisma.court.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [{ pricePerHour: 'desc' }, { name: 'asc' }, { id: 'asc' }],
        skip: 20,
        take: 10,
      });
      expect(result).toMatchObject({
        total: 25,
        page: 3,
        limit: 10,
        totalPages: 3,
      });
    });

    it('chỉ áp cận giá khi tham số được truyền (minPrice = 0 vẫn có hiệu lực)', async () => {
      prisma.court.findMany.mockResolvedValue([]);
      prisma.court.count.mockResolvedValue(0);

      await service.findAll(query({ minPrice: 0 }));

      expect(prisma.court.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { pricePerHour: { gte: 0 } },
        }),
      );
    });
  });
});
