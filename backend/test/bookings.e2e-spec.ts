import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

interface RegisteredUser {
  id: string;
}

interface LoginResponse {
  access_token: string;
}

interface BookingResponse {
  id: string;
  status: string;
}

interface ErrorResponse {
  message: string;
}

// Ngày cố định trong tương lai + sân riêng để không đụng dữ liệu thật/seed.
const DAY = '2031-03-10';
const at = (hour: number, minute = 0) =>
  `${DAY}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+07:00`;

function parseJson<T>(response: { text: string }): T {
  return JSON.parse(response.text) as T;
}

describe('Bookings overlap invariants (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let token: string;
  let ownerId: string;
  let customerId: string;
  let courtId: string;
  let otherCourtId: string;
  const suffix = Date.now();

  const postBooking = (payload: {
    courtId: string;
    startTime: string;
    endTime: string;
  }) =>
    request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    const owner = await prisma.user.create({
      data: {
        email: `booking-e2e-owner-${suffix}@example.com`,
        password: 'secret123',
        name: 'Chủ sân e2e',
        role: 'OWNER',
      },
    });
    ownerId = owner.id;

    const courtData = {
      type: 'Badminton',
      address: 'Địa chỉ test e2e',
      pricePerHour: 150000,
      openTime: '06:00',
      closeTime: '22:00',
      ownerId,
    };
    const court = await prisma.court.create({
      data: { ...courtData, name: `Sân e2e 1 ${suffix}` },
    });
    const otherCourt = await prisma.court.create({
      data: { ...courtData, name: `Sân e2e 2 ${suffix}` },
    });
    courtId = court.id;
    otherCourtId = otherCourt.id;

    const customerEmail = `booking-e2e-customer-${suffix}@example.com`;
    const registered = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: customerEmail, password: 'secret123', name: 'Khách e2e' })
      .expect(201);
    customerId = parseJson<RegisteredUser>(registered).id;

    const loggedIn = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: customerEmail, password: 'secret123' })
      .expect(201);
    token = parseJson<LoginResponse>(loggedIn).access_token;
  }, 60000);

  it('allows back-to-back bookings because ranges are half-open', async () => {
    const first = await postBooking({
      courtId,
      startTime: at(11),
      endTime: at(12),
    }).expect(201);
    const second = await postBooking({
      courtId,
      startTime: at(12),
      endTime: at(13),
    }).expect(201);

    expect(parseJson<BookingResponse>(first).status).toBe('PENDING');
    expect(parseJson<BookingResponse>(second).status).toBe('PENDING');
  });

  it('accepts exactly one of two concurrent requests for the same slot', async () => {
    const payload = { courtId, startTime: at(10), endTime: at(11) };

    const [first, second] = await Promise.all([
      postBooking(payload),
      postBooking(payload),
    ]);
    const statuses = [first.status, second.status].sort();

    expect(statuses).toEqual([201, 409]);
    expect(
      parseJson<ErrorResponse>(first.status === 409 ? first : second).message,
    ).toBe('Sân đã có đơn đặt trong khoảng thời gian này');

    const saved = await prisma.booking.count({
      where: {
        courtId,
        startTime: new Date(at(10)),
        endTime: new Date(at(11)),
      },
    });
    expect(saved).toBe(1);
  });

  it('rejects an overlap with a PENDING booking', async () => {
    await postBooking({ courtId, startTime: at(13), endTime: at(14) }).expect(
      201,
    );
    await postBooking({
      courtId,
      startTime: at(13, 30),
      endTime: at(14, 30),
    }).expect(409);
  });

  it('rejects an overlap with a CONFIRMED booking, including for other writers', async () => {
    const created = await postBooking({
      courtId,
      startTime: at(15),
      endTime: at(16),
    }).expect(201);
    const bookingId = parseJson<BookingResponse>(created).id;
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED' },
    });

    await postBooking({
      courtId,
      startTime: at(15, 30),
      endTime: at(16, 30),
    }).expect(409);

    // Ghi trực tiếp qua Prisma (bỏ qua pre-check của service) vẫn phải bị ràng buộc database chặn.
    await expect(
      prisma.booking.create({
        data: {
          courtId,
          userId: customerId,
          startTime: new Date(at(15, 30)),
          endTime: new Date(at(16, 30)),
          status: 'PENDING',
        },
      }),
    ).rejects.toThrow(/booking_no_overlap/);
  });

  it('allows reusing a slot whose only other booking was cancelled', async () => {
    const created = await postBooking({
      courtId,
      startTime: at(17),
      endTime: at(18),
    }).expect(201);
    const bookingId = parseJson<BookingResponse>(created).id;

    await request(app.getHttpServer())
      .patch(`/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await postBooking({
      courtId,
      startTime: at(17, 30),
      endTime: at(18, 30),
    }).expect(201);

    // Ràng buộc loại trừ bỏ qua các booking đã hủy.
    const cancelledOverlap = await prisma.booking.create({
      data: {
        courtId,
        userId: customerId,
        startTime: new Date(at(17, 30)),
        endTime: new Date(at(18, 30)),
        status: 'CANCELLED',
      },
    });
    expect(cancelledOverlap.status).toBe('CANCELLED');
  });

  it('allows the same slot on another court', async () => {
    await postBooking({
      courtId: otherCourtId,
      startTime: at(10),
      endTime: at(11),
    }).expect(201);
  });

  it('rejects ranges whose end is not after the start, also at the database level', async () => {
    await postBooking({ courtId, startTime: at(19), endTime: at(19) }).expect(
      400,
    );
    await postBooking({ courtId, startTime: at(19), endTime: at(18) }).expect(
      400,
    );

    // CHECK constraint chặn cả những writer khác service.
    await expect(
      prisma.booking.create({
        data: {
          courtId,
          userId: customerId,
          startTime: new Date(at(19)),
          endTime: new Date(at(19)),
          status: 'PENDING',
        },
      }),
    ).rejects.toThrow(/booking_time_range_valid/);
  });

  afterAll(async () => {
    await prisma.booking.deleteMany({
      where: { courtId: { in: [courtId, otherCourtId] } },
    });
    await prisma.court.deleteMany({
      where: { id: { in: [courtId, otherCourtId] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [ownerId, customerId] } },
    });
    await app.close();
  }, 60000);
});
