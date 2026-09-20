import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  const prisma = {
    user: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    court: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const courtInput = {
    name: 'Green Field 03',
    type: 'Bóng đá',
    address: '12 Lê Lợi, Hà Nội',
    pricePerHour: 150000,
    openTime: '06:00',
    closeTime: '22:00',
  };

  const ownerProfile = {
    id: 'user-1',
    email: 'khach@test.com',
    name: 'Khách B',
    phone: '0900000002',
    role: 'OWNER',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  // $transaction chạy callback với chính mock prisma để test được các lệnh bên trong
  prisma.$transaction.mockImplementation(
    (callback: (tx: unknown) => Promise<unknown>) => callback(prisma),
  );

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('báo lỗi khi không tìm thấy tài khoản', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.findMe('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('đăng ký chủ sân: đổi vai trò và tạo sân đầu tiên trong cùng transaction', async () => {
    const createdCourt = { id: 'court-1', ...courtInput, ownerId: 'user-1' };
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: 'CUSTOMER',
    });
    prisma.user.updateMany.mockResolvedValue({ count: 1 });
    prisma.user.findUniqueOrThrow.mockResolvedValue(ownerProfile);
    prisma.court.create.mockResolvedValue(createdCourt);

    const result = await service.becomeOwner('user-1', courtInput);

    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: 'user-1', role: 'CUSTOMER' },
      data: { role: 'OWNER' },
    });
    expect(prisma.court.create).toHaveBeenCalledWith({
      data: { ...courtInput, ownerId: 'user-1' },
    });
    expect(result).toEqual({ user: ownerProfile, court: createdCourt });
  });

  it('báo lỗi khi không tìm thấy tài khoản đăng ký chủ sân', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.becomeOwner('missing', courtInput),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.court.create).not.toHaveBeenCalled();
  });

  it('báo lỗi khi tài khoản đã là chủ sân', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', role: 'OWNER' });

    await expect(
      service.becomeOwner('user-1', courtInput),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.court.create).not.toHaveBeenCalled();
  });

  it('chặn request đồng thời: không tạo sân khi vai trò đã đổi trong transaction', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: 'CUSTOMER',
    });
    prisma.user.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.becomeOwner('user-1', courtInput),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.court.create).not.toHaveBeenCalled();
  });
});
