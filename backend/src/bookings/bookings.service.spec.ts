import { Test, TestingModule } from '@nestjs/testing';
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
    prisma.booking.create.mockImplementation(async ({ data }) => data);

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
});
