import { PrismaClient, Role, BookingStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10);

  const owners = [
    { email: 'owner@test.com', name: 'Nguyễn Minh Anh', phone: '0900000001' },
    {
      email: 'owner.linh@test.com',
      name: 'Trần Hoàng Linh',
      phone: '0900000003',
    },
    { email: 'owner.nam@test.com', name: 'Phạm Quốc Nam', phone: '0900000004' },
    { email: 'owner.ha@test.com', name: 'Lê Thu Hà', phone: '0900000005' },
  ];

  const customers = [
    { email: 'customer@test.com', name: 'Lê Minh Khang', phone: '0900000002' },
    {
      email: 'customer.lan@test.com',
      name: 'Nguyễn Ngọc Lan',
      phone: '0900000006',
    },
    {
      email: 'customer.tuan@test.com',
      name: 'Đỗ Anh Tuấn',
      phone: '0900000007',
    },
    { email: 'customer.huy@test.com', name: 'Vũ Đức Huy', phone: '0900000008' },
    {
      email: 'customer.thao@test.com',
      name: 'Bùi Phương Thảo',
      phone: '0900000009',
    },
    {
      email: 'customer.khanh@test.com',
      name: 'Hoàng Gia Khánh',
      phone: '0900000010',
    },
    {
      email: 'customer.vy@test.com',
      name: 'Phan Khánh Vy',
      phone: '0900000011',
    },
    {
      email: 'customer.long@test.com',
      name: 'Trịnh Hải Long',
      phone: '0900000012',
    },
  ];

  const ownerUsers = await Promise.all(
    owners.map((owner) =>
      prisma.user.upsert({
        where: { email: owner.email },
        update: { name: owner.name, phone: owner.phone, role: Role.OWNER },
        create: { ...owner, password: hashedPassword, role: Role.OWNER },
      }),
    ),
  );

  const customerUsers = await Promise.all(
    customers.map((customer) =>
      prisma.user.upsert({
        where: { email: customer.email },
        update: {
          name: customer.name,
          phone: customer.phone,
          role: Role.CUSTOMER,
        },
        create: { ...customer, password: hashedPassword, role: Role.CUSTOMER },
      }),
    ),
  );

  const courtData = [
    [
      'Sân bóng đá Mini Cầu Giấy 1',
      'Bóng đá',
      'Cầu Giấy, Hà Nội',
      220000,
      '06:00',
      '23:00',
      0,
    ],
    [
      'Sân bóng đá Mini Cầu Giấy 2',
      'Bóng đá',
      'Cầu Giấy, Hà Nội',
      200000,
      '06:00',
      '22:00',
      0,
    ],
    [
      'Sân cầu lông Smash Zone',
      'Cầu lông',
      'Thanh Xuân, Hà Nội',
      100000,
      '07:00',
      '23:00',
      1,
    ],
    [
      'Sân cầu lông Hoàng Mai',
      'Cầu lông',
      'Hoàng Mai, Hà Nội',
      90000,
      '06:00',
      '22:00',
      1,
    ],
    [
      'Tennis Lakeside',
      'Tennis',
      'Tây Hồ, Hà Nội',
      280000,
      '06:00',
      '21:00',
      2,
    ],
    [
      'Tennis Garden 1',
      'Tennis',
      'Nam Từ Liêm, Hà Nội',
      250000,
      '07:00',
      '22:00',
      2,
    ],
    [
      'Pickleball 360',
      'Pickleball',
      'Đống Đa, Hà Nội',
      180000,
      '06:00',
      '23:00',
      3,
    ],
    [
      'Sân bóng rổ Hoàng Cầu',
      'Bóng rổ',
      'Đống Đa, Hà Nội',
      160000,
      '06:00',
      '22:00',
      3,
    ],
    [
      'Sân bóng đá Phú Đô',
      'Bóng đá',
      'Nam Từ Liêm, Hà Nội',
      240000,
      '05:30',
      '23:00',
      2,
    ],
    [
      'Sân đa năng Tây Hồ',
      'Khác',
      'Tây Hồ, Hà Nội',
      150000,
      '06:00',
      '22:00',
      1,
    ],
  ] as const;

  const courts = await Promise.all(
    courtData.map(
      (
        [name, type, address, pricePerHour, openTime, closeTime, ownerIndex],
        index,
      ) =>
        prisma.court.upsert({
          where: { id: `seed-court-${index + 1}` },
          update: {
            name,
            type,
            address,
            pricePerHour,
            openTime,
            closeTime,
            ownerId: ownerUsers[ownerIndex].id,
          },
          create: {
            id: `seed-court-${index + 1}`,
            name,
            type,
            address,
            pricePerHour,
            openTime,
            closeTime,
            ownerId: ownerUsers[ownerIndex].id,
          },
        }),
    ),
  );

  const dateAt = (dayOffset: number, hour: number) => {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    date.setHours(hour, 0, 0, 0);
    return date;
  };

  const bookingData = [
    [0, 0, 1, 19, BookingStatus.CONFIRMED],
    [1, 1, 2, 18, BookingStatus.PENDING],
    [2, 2, 3, 20, BookingStatus.CONFIRMED],
    [3, 3, 4, 17, BookingStatus.PENDING],
    [4, 4, 5, 19, BookingStatus.CONFIRMED],
    [5, 5, 6, 18, BookingStatus.CANCELLED],
    [6, 6, 7, 20, BookingStatus.PENDING],
    [7, 7, 0, 16, BookingStatus.CONFIRMED],
    [8, 0, 3, 18, BookingStatus.PENDING],
    [9, 1, 4, 19, BookingStatus.CONFIRMED],
    [0, 2, 5, 21, BookingStatus.PENDING],
    [1, 3, 6, 14, BookingStatus.CONFIRMED],
    [2, 4, 7, 15, BookingStatus.CANCELLED],
    [3, 5, 0, 20, BookingStatus.CONFIRMED],
    [4, 6, 1, 19, BookingStatus.PENDING],
    [5, 7, 2, 17, BookingStatus.CONFIRMED],
    [6, 0, 4, 21, BookingStatus.PENDING],
    [7, 1, 5, 20, BookingStatus.CONFIRMED],
    [8, 2, 6, 18, BookingStatus.PENDING],
    [9, 3, 7, 19, BookingStatus.CONFIRMED],
  ] as const;

  await Promise.all(
    bookingData.map(
      ([courtIndex, customerIndex, dayOffset, hour, status], index) =>
        prisma.booking.upsert({
          where: { id: `seed-booking-${index + 1}` },
          update: {
            courtId: courts[courtIndex].id,
            userId: customerUsers[customerIndex].id,
            startTime: dateAt(dayOffset, hour),
            endTime: dateAt(dayOffset, hour + 1),
            status,
            pricePerHour: courts[courtIndex].pricePerHour,
            totalPrice: courts[courtIndex].pricePerHour,
          },
          create: {
            id: `seed-booking-${index + 1}`,
            courtId: courts[courtIndex].id,
            userId: customerUsers[customerIndex].id,
            startTime: dateAt(dayOffset, hour),
            endTime: dateAt(dayOffset, hour + 1),
            status,
            pricePerHour: courts[courtIndex].pricePerHour,
            totalPrice: courts[courtIndex].pricePerHour,
          },
        }),
    ),
  );

  console.log(
    `Seed complete: ${ownerUsers.length} owners, ${customerUsers.length} customers, ${courts.length} courts, ${bookingData.length} bookings.`,
  );
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
