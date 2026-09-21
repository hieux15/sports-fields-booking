import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { Booking, Prisma } from '@prisma/client';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../prisma/prisma.service';

// Message thật khi vi phạm ràng buộc loại trừ: PostgreSQL trả SQLSTATE 23P01 và Prisma 6 bọc lại
// thành PrismaClientUnknownRequestError (không có code/meta), nên service chỉ có thể nhận diện
// qua tên constraint hoặc mã lỗi trong message.
const OVERLAP_DATABASE_ERROR_MESSAGE =
  'Error occurred during query execution: ConnectorError(ConnectorError { user_facing_error: None, kind: QueryError(PostgresError { code: "23P01", message: "conflicting key value violates exclusion constraint \\"booking_no_overlap\\"", severity: "ERROR" }) })';

const UNRELATED_DATABASE_ERROR_MESSAGE =
  'Error occurred during query execution: ConnectorError(ConnectorError { user_facing_error: None, kind: QueryError(PostgresError { code: "40P01", message: "deadlock detected", severity: "ERROR" }) })';

const unknownRequestError = (message: string) =>
  new Prisma.PrismaClientUnknownRequestError(message, {
    clientVersion: 'test',
  });

describe('BookingsService', () => {
  let service: BookingsService;
  let prisma: {
    booking: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      findMany: jest.Mock;
    };
    court: {
      findUnique: jest.Mock;
    };
  };

  const court = {
    id: 'court-1',
    openTime: '06:00',
    closeTime: '22:00',
  };

  const validBooking = {
    courtId: 'court-1',
    startTime: '2027-01-15T20:00:00+07:00',
    endTime: '2027-01-15T21:00:00+07:00',
  };

  // Trả về đúng dữ liệu service truyền xuống Prisma để test luồng tạo booking thành công.
  const echoCreatedBooking = () =>
    prisma.booking.create.mockImplementation(({ data }) =>
      Promise.resolve(data as Booking),
    );

  beforeEach(async () => {
    prisma = {
      booking: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      court: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('checks opening hours in Vietnam time regardless of server timezone', async () => {
    prisma.court.findUnique.mockResolvedValue(court);
    prisma.booking.findFirst.mockResolvedValue(null);
    echoCreatedBooking();

    const result = await service.create(validBooking, 'user-1');

    expect(result.startTime).toEqual(new Date('2027-01-15T13:00:00.000Z'));
    expect(result.endTime).toEqual(new Date('2027-01-15T14:00:00.000Z'));
  });

  it('rejects bookings outside the court opening hours', async () => {
    prisma.court.findUnique.mockResolvedValue(court);

    await expect(
      service.create(
        {
          courtId: 'court-1',
          startTime: '2027-01-15T05:00:00+07:00',
          endTime: '2027-01-15T06:00:00+07:00',
        },
        'user-1',
      ),
    ).rejects.toThrow('Sân hoạt động từ 06:00 đến 22:00');
    expect(prisma.booking.findFirst).not.toHaveBeenCalled();
  });

  it('rejects bookings shorter than one hour', async () => {
    prisma.court.findUnique.mockResolvedValue(court);

    await expect(
      service.create(
        {
          courtId: 'court-1',
          startTime: '2027-01-15T20:00:00+07:00',
          endTime: '2027-01-15T20:45:00+07:00',
        },
        'user-1',
      ),
    ).rejects.toThrow('Thời lượng đặt sân phải từ 1 đến 4 giờ');
    expect(prisma.booking.findFirst).not.toHaveBeenCalled();
  });

  it('rejects bookings longer than four hours', async () => {
    prisma.court.findUnique.mockResolvedValue(court);

    await expect(
      service.create(
        {
          courtId: 'court-1',
          startTime: '2027-01-15T17:00:00+07:00',
          endTime: '2027-01-15T22:00:00+07:00',
        },
        'user-1',
      ),
    ).rejects.toThrow('Thời lượng đặt sân phải từ 1 đến 4 giờ');
    expect(prisma.booking.findFirst).not.toHaveBeenCalled();
  });

  it('ignores cancelled bookings and only treats half-open overlaps as conflicts', async () => {
    prisma.court.findUnique.mockResolvedValue(court);
    prisma.booking.findFirst.mockResolvedValue(null);
    echoCreatedBooking();

    await service.create(validBooking, 'user-1');

    // status <> CANCELLED: đơn đã hủy không chặn đơn mới.
    // startTime < endTime mới và endTime > startTime mới: khung giờ liền kề vẫn hợp lệ.
    expect(prisma.booking.findFirst).toHaveBeenCalledWith({
      where: {
        courtId: 'court-1',
        status: { not: 'CANCELLED' },
        startTime: { lt: new Date('2027-01-15T14:00:00.000Z') },
        endTime: { gt: new Date('2027-01-15T13:00:00.000Z') },
      },
    });
  });

  it('rejects bookings overlapping an active booking found by the pre-check', async () => {
    prisma.court.findUnique.mockResolvedValue(court);
    prisma.booking.findFirst.mockResolvedValue({ id: 'booking-1' });

    await expect(service.create(validBooking, 'user-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.booking.create).not.toHaveBeenCalled();
  });

  it('maps database exclusion violations to conflict errors', async () => {
    prisma.court.findUnique.mockResolvedValue(court);
    prisma.booking.findFirst.mockResolvedValue(null);
    prisma.booking.create.mockRejectedValue(
      unknownRequestError(OVERLAP_DATABASE_ERROR_MESSAGE),
    );

    await expect(service.create(validBooking, 'user-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rethrows unrelated database errors instead of reporting a conflict', async () => {
    prisma.court.findUnique.mockResolvedValue(court);
    prisma.booking.findFirst.mockResolvedValue(null);
    const databaseError = unknownRequestError(UNRELATED_DATABASE_ERROR_MESSAGE);
    prisma.booking.create.mockRejectedValue(databaseError);

    await expect(service.create(validBooking, 'user-1')).rejects.toBe(
      databaseError,
    );
  });
});
