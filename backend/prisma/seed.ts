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

  /**
   * Ảnh thật cho từng sân trong seed (mỗi sân một ảnh khác nhau) để trang danh
   * sách không còn cảnh mọi sân cùng loại dùng chung một ảnh minh hoạ.
   * URL đã được kiểm tra trả 200; sân do người dùng tạo vẫn upload ảnh thật qua
   * `POST /courts/images`.
   */
  const courtPhoto = (photoId: string) =>
    `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1400&q=80`;

  const courtData = [
    [
      'Sân bóng đá Mini Cầu Giấy 1',
      'FOOTBALL',
      'Cầu Giấy, Hà Nội',
      220000,
      '06:00',
      '23:00',
      0,
      courtPhoto('1459865264687-595d652de67e'),
    ],
    [
      'Sân bóng đá Mini Cầu Giấy 2',
      'FOOTBALL',
      'Cầu Giấy, Hà Nội',
      200000,
      '06:00',
      '22:00',
      0,
      courtPhoto('1529900748604-07564a03e7a6'),
    ],
    [
      'Sân cầu lông Smash Zone',
      'BADMINTON',
      'Thanh Xuân, Hà Nội',
      100000,
      '07:00',
      '23:00',
      1,
      courtPhoto('1626224583764-f87db24ac4ea'),
    ],
    [
      'Sân cầu lông Hoàng Mai',
      'BADMINTON',
      'Hoàng Mai, Hà Nội',
      90000,
      '06:00',
      '22:00',
      1,
      courtPhoto('1613918431703-aa50889e3be9'),
    ],
    [
      'Tennis Lakeside',
      'TENNIS',
      'Tây Hồ, Hà Nội',
      280000,
      '06:00',
      '21:00',
      2,
      courtPhoto('1531315630201-bb15abeb1653'),
    ],
    [
      'Tennis Garden 1',
      'TENNIS',
      'Nam Từ Liêm, Hà Nội',
      250000,
      '07:00',
      '22:00',
      2,
      courtPhoto('1595435934249-5df7ed86e1c0'),
    ],
    [
      'Pickleball 360',
      'PICKLEBALL',
      'Đống Đa, Hà Nội',
      180000,
      '06:00',
      '23:00',
      3,
      courtPhoto('1612872087720-bb876e2e67d1'),
    ],
    [
      'Sân bóng rổ Hoàng Cầu',
      'BASKETBALL',
      'Đống Đa, Hà Nội',
      160000,
      '06:00',
      '22:00',
      3,
      courtPhoto('1504457047772-27faf1c00561'),
    ],
    [
      'Sân bóng đá Phú Đô',
      'FOOTBALL',
      'Nam Từ Liêm, Hà Nội',
      240000,
      '05:30',
      '23:00',
      2,
      courtPhoto('1489599849927-2ee91cede3ba'),
    ],
    [
      'Sân đa năng Tây Hồ',
      'OTHER',
      'Tây Hồ, Hà Nội',
      150000,
      '06:00',
      '22:00',
      1,
      courtPhoto('1517649763962-0c623066013b'),
    ],
  ] as const;

  const courts = await Promise.all(
    courtData.map(
      (
        [
          name,
          type,
          address,
          pricePerHour,
          openTime,
          closeTime,
          ownerIndex,
          imageUrl,
        ],
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
            imageUrl,
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
            imageUrl,
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
    // Dòng quá khứ (dayOffset âm): lịch sử COMPLETED/EXPIRED để dashboard
    // doanh thu có dữ liệu ngay sau khi seed (cron cũng tự sinh các trạng thái này).
    [0, 1, -1, 20, BookingStatus.COMPLETED],
    [1, 2, -2, 18, BookingStatus.COMPLETED],
    [2, 3, -3, 19, BookingStatus.COMPLETED],
    [3, 4, -1, 15, BookingStatus.EXPIRED],
    [4, 5, -2, 21, BookingStatus.CANCELLED],
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

  const reviewData = [
    [0, 0, 5, 'Sân đẹp, giá tốt'],
    [0, 2, 4, 'Cỏ tốt, không bị lầy'],
    [0, 4, 4],
    [1, 1, 4, 'Sân rộng, thoáng mát'],
    [1, 3, 3, 'Cần khắc phục hệ thống thoát nước'],
    [2, 2, 5, 'Sân đẹp, đèn sáng, rất thích'],
    [2, 0, 4, 'Giá hợp lý'],
    [4, 5, 5, 'Mặt sân đẹp, dịch vụ tốt'],
    [4, 2, 5],
    [4, 3, 4, 'Cần thêm bóng nước uống'],
    [6, 1, 4, 'Sân mới, sạch sẽ'],
    [6, 4, 3, 'Wifi yếu'],
    [8, 0, 5, 'Sân đẹp nhất khu vực'],
    [8, 6, 4],
    [9, 3, 4, 'Giá hợp lý, nhân viên thân thiện'],
  ] as const;

  await Promise.all(
    reviewData.map(([courtIndex, customerIndex, rating, comment], index) =>
      prisma.review.upsert({
        where: { id: `seed-review-${index + 1}` },
        update: {
          userId: customerUsers[customerIndex].id,
          courtId: courts[courtIndex].id,
          rating,
          comment: comment ?? undefined,
        },
        create: {
          id: `seed-review-${index + 1}`,
          userId: customerUsers[customerIndex].id,
          courtId: courts[courtIndex].id,
          rating,
          comment: comment ?? undefined,
        },
      }),
    ),
  );

  await prisma.$transaction(
    courts.map((court, courtIndex) => {
      const courtReviews = reviewData.filter((r) => r[0] === courtIndex);
      const avg =
        courtReviews.length > 0
          ? courtReviews.reduce((sum, r) => sum + r[2], 0) / courtReviews.length
          : null;
      return prisma.court.update({
        where: { id: court.id },
        data: { avgRating: avg ? Number(avg.toFixed(1)) : null },
      });
    }),
  );

  console.log(
    `Seed complete: ${ownerUsers.length} owners, ${customerUsers.length} customers, ${courts.length} courts, ${bookingData.length} bookings, ${reviewData.length} reviews.`,
  );
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
