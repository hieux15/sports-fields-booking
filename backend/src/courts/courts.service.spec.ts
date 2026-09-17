import { NotFoundException } from '@nestjs/common';
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
    },
  };

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
});
