import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { ConflictException } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../prisma/prisma.service';

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
    prisma.court.findUnique.mockResolvedValue({
      id: 'court-1',
      openTime: '06:00',
      closeTime: '22:00',
    });
    prisma.booking.findFirst.mockResolvedValue(null);
    prisma.booking.create.mockImplementation(({ data }) => data);

    const result = await service.create(
      {
        courtId: 'court-1',
        startTime: '2027-01-15T20:00:00+07:00',
        endTime: '2027-01-15T21:00:00+07:00',
      },
      'user-1',
    );

    expect(result.startTime).toEqual(new Date('2027-01-15T13:00:00.000Z'));
    expect(result.endTime).toEqual(new Date('2027-01-15T14:00:00.000Z'));
  });

  it('rejects bookings shorter than one hour', async () => {
    prisma.court.findUnique.mockResolvedValue({
      id: 'court-1',
      openTime: '06:00',
      closeTime: '22:00',
    });

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
    prisma.court.findUnique.mockResolvedValue({
      id: 'court-1',
      openTime: '06:00',
      closeTime: '22:00',
    });

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

  it('maps database overlap violations to conflict errors', async () => {
    prisma.court.findUnique.mockResolvedValue({
      id: 'court-1',
      openTime: '06:00',
      closeTime: '22:00',
    });
    prisma.booking.findFirst.mockResolvedValue(null);
    prisma.booking.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the fields: (`courtId`,`startTime`,`endTime`)',
        {
          code: 'P2004',
          clientVersion: 'test',
          meta: { target: ['courtId'] },
        },
      ),
    );

    await expect(
      service.create(
        {
          courtId: 'court-1',
          startTime: '2027-01-15T20:00:00+07:00',
          endTime: '2027-01-15T21:00:00+07:00',
        },
        'user-1',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('BookingsService integration', () => {
  let prisma: PrismaService;
  let service: BookingsService;
  let courtId: string;
  let ownerId: string;
  let userId: string;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();

    const owner = await prisma.user.create({
      data: {
        email: `owner-${Date.now()}@example.com`,
        password: 'secret',
        name: 'Owner',
        phone: '0900000001',
        role: 'OWNER',
      },
    });

    const user = await prisma.user.create({
      data: {
        email: `customer-${Date.now()}@example.com`,
        password: 'secret',
        name: 'Customer',
        phone: '0900000002',
        role: 'CUSTOMER',
      },
    });

    const court = await prisma.court.create({
      data: {
        name: 'Sân test concurrent',
        type: 'BADMINTON',
        address: 'Test address',
        pricePerHour: 150000,
        openTime: '06:00',
        closeTime: '22:00',
        ownerId: owner.id,
      },
    });

    ownerId = owner.id;
    userId = user.id;
    courtId = court.id;

    service = new BookingsService(prisma);
  });

  afterAll(async () => {
    await prisma.booking.deleteMany({
      where: { courtId },
    });
    await prisma.court.delete({
      where: { id: courtId },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [ownerId, userId] } },
    });
    await prisma.$disconnect();
  });

  it('rejects two concurrent booking attempts for the same time slot', async () => {
    const startTime = new Date('2030-01-15T10:00:00+07:00');
    const endTime = new Date('2030-01-15T11:00:00+07:00');

    const firstAttempt = service.create(
      {
        courtId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
      userId,
    );

    const secondAttempt = service.create(
      {
        courtId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
      userId,
    );

    const results = await Promise.allSettled([firstAttempt, secondAttempt]);
    const fulfilled = results.filter(
      (result): result is PromiseFulfilledResult<unknown> =>
        result.status === 'fulfilled',
    );
    const rejected = results.filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toBeInstanceOf(ConflictException);

    const savedBookings = await prisma.booking.count({
      where: {
        courtId,
        startTime,
        endTime,
      },
    });

    expect(savedBookings).toBe(1);
  });
});
