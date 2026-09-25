import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BookingsScheduler } from './bookings.scheduler';
import { PrismaService } from '../prisma/prisma.service';

describe('BookingsScheduler', () => {
  let scheduler: BookingsScheduler;
  let prisma: {
    booking: {
      updateMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma = {
      booking: {
        updateMany: jest.fn(),
      },
      // Prisma nhận mảng promise và chạy song song — mock chạy Promise.all y hệt.
      $transaction: jest.fn((input: Promise<unknown>[]) => Promise.all(input)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsScheduler,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    scheduler = module.get<BookingsScheduler>(BookingsScheduler);
  });

  it('should be defined', () => {
    expect(scheduler).toBeDefined();
  });

  it('quét: PENDING quá giờ bắt đầu → EXPIRED, CONFIRMED qua giờ kết thúc → COMPLETED', async () => {
    prisma.booking.updateMany
      .mockResolvedValueOnce({ count: 3 })
      .mockResolvedValueOnce({ count: 2 });
    const now = new Date('2026-09-25T12:00:00.000Z');

    const result = await scheduler.sweepBookingStatuses(now);

    expect(prisma.booking.updateMany).toHaveBeenNthCalledWith(1, {
      where: { status: 'PENDING', startTime: { lte: now } },
      data: { status: 'EXPIRED' },
    });
    expect(prisma.booking.updateMany).toHaveBeenNthCalledWith(2, {
      where: { status: 'CONFIRMED', endTime: { lte: now } },
      data: { status: 'COMPLETED' },
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ expired: 3, completed: 2 });
  });

  it('mặc định quét với thời điểm hiện tại', async () => {
    prisma.booking.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 0 });
    const before = Date.now();

    await scheduler.sweepBookingStatuses();

    // jest.Mock không giữ kiểu tham số — ép kiểu đúng cấu trúc service truyền xuống.
    const calls = prisma.booking.updateMany.mock.calls as [
      [{ where: { startTime: { lte: Date } } }],
    ];
    const usedNow = calls[0][0].where.startTime.lte;
    expect(usedNow.getTime()).toBeGreaterThanOrEqual(before);
    expect(usedNow.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('chỉ ghi log khi có đơn thật sự được chuyển trạng thái', async () => {
    const logSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);

    prisma.booking.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 0 });
    await scheduler.sweepBookingStatuses();
    expect(logSpy).not.toHaveBeenCalled();

    prisma.booking.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 4 });
    await scheduler.sweepBookingStatuses();
    expect(logSpy).toHaveBeenCalledTimes(1);

    logSpy.mockRestore();
  });

  it('handleExpiredBookings gọi sweepBookingStatuses (cron mỗi phút)', async () => {
    const sweep = jest
      .spyOn(scheduler, 'sweepBookingStatuses')
      .mockResolvedValue({ expired: 0, completed: 0 });

    await scheduler.handleExpiredBookings();

    expect(sweep).toHaveBeenCalledTimes(1);
  });
});
