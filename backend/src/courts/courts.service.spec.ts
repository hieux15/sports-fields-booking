import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CourtsService } from './courts.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CourtsService', () => {
  let service: CourtsService;
  const prisma = {
    court: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    booking: {
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  // $transaction chạy callback với chính mock prisma để test được các lệnh bên trong
  prisma.$transaction.mockImplementation(
    (callback: (tx: unknown) => Promise<unknown>) => callback(prisma),
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
});
