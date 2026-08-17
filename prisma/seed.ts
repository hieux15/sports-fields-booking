import { PrismaClient, Role, BookingStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10);

  const owner = await prisma.user.create({
    data: {
      email: 'owner@test.com',
      password: hashedPassword,
      name: 'Chủ sân A',
      phone: '0900000001',
      role: Role.OWNER,
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'customer@test.com',
      password: hashedPassword,
      name: 'Khách B',
      phone: '0900000002',
      role: Role.CUSTOMER,
    },
  });

  const court = await prisma.court.create({
    data: {
      name: 'Sân bóng đá Mini - Sân 1',
      type: 'bóng đá',
      address: 'Cầu Giấy, Hà Nội',
      pricePerHour: 200000,
      openTime: '06:00',
      closeTime: '22:00',
      ownerId: owner.id,
    },
  });

  await prisma.booking.create({
    data: {
      courtId: court.id,
      userId: customer.id,
      startTime: new Date('2026-08-20T19:00:00'),
      endTime: new Date('2026-08-20T20:00:00'),
      status: BookingStatus.CONFIRMED,
    },
  });

  console.log('Seed data created.');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
