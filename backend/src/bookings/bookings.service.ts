import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Prisma } from '@prisma/client';
import { CourtAvailabilityDto } from './dto/court-availability.dto';

const MIN_BOOKING_MINUTES = 60;
const MAX_BOOKING_MINUTES = 240;
// Tên ràng buộc loại trừ chống trùng giờ.
const OVERLAP_CONSTRAINT_NAME = 'booking_no_overlap';
// SQLSTATE 23P01 = exclusion_violation của PostgreSQL.
const EXCLUSION_VIOLATION_SQLSTATE = '23p01';

function readErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const { message } = error as { message?: unknown };
    return typeof message === 'string' ? message : '';
  }
  return '';
}

function isBookingOverlapViolation(error: unknown): boolean {
  const message = readErrorMessage(error).toLowerCase();
  return (
    message.includes(OVERLAP_CONSTRAINT_NAME) ||
    message.includes(EXCLUSION_VIOLATION_SQLSTATE)
  );
}

// Đổi giờ dạng "H:mm" hoặc "HH:mm" thành số phút kể từ 00:00, trả về null nếu sai định dạng
function toMinutesOfDay(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) {
    return null;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) {
    return null;
  }
  return hours * 60 + minutes;
}

function getVietnamMinutes(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return (
    Number(values.hour) * 60 +
    Number(values.minute) +
    Number(values.second) / 60
  );
}

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async getCourtAvailability(courtId: string, query: CourtAvailabilityDto) {
    const court = await this.prisma.court.findUnique({
      where: { id: courtId },
    });
    if (!court) throw new NotFoundException('Sân thể thao không tồn tại');

    const openMinutes = toMinutesOfDay(court.openTime);
    const closeMinutes = toMinutesOfDay(court.closeTime);
    if (
      openMinutes === null ||
      closeMinutes === null ||
      openMinutes >= closeMinutes
    ) {
      throw new BadRequestException('Giờ hoạt động của sân không hợp lệ');
    }

    // Ngày và giờ hoạt động được hiểu theo múi giờ Việt Nam (UTC+7).
    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(query.date);
    const calendarDate = dateMatch
      ? new Date(
          Date.UTC(
            Number(dateMatch[1]),
            Number(dateMatch[2]) - 1,
            Number(dateMatch[3]),
          ),
        )
      : null;
    if (
      !calendarDate ||
      calendarDate.toISOString().slice(0, 10) !== query.date
    ) {
      throw new BadRequestException('Ngày không hợp lệ');
    }
    // midnight UTC minus seven hours represents midnight in Vietnam; comparing
    // its UTC date directly with the input would incorrectly reject valid dates.
    const dayStart = new Date(calendarDate.getTime() - 7 * 60 * 60 * 1000);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const bookings = await this.prisma.booking.findMany({
      where: {
        courtId,
        // CANCELLED và EXPIRED đều đã nhả slot: chỉ đơn còn hiệu lực mới chặn giờ.
        status: { notIn: ['CANCELLED', 'EXPIRED'] },
        startTime: { lt: dayEnd },
        endTime: { gt: dayStart },
      },
      select: { startTime: true, endTime: true },
    });

    const slots: { start: string; end: string }[] = [];
    const now = Date.now();
    for (
      let start = openMinutes;
      start + query.durationMinutes <= closeMinutes;
      start += 30
    ) {
      const end = start + query.durationMinutes;
      const startTime = new Date(dayStart.getTime() + start * 60_000);
      const endTime = new Date(dayStart.getTime() + end * 60_000);
      if (startTime.getTime() <= now) continue;
      if (
        bookings.some(
          (booking) =>
            booking.startTime < endTime && booking.endTime > startTime,
        )
      )
        continue;
      slots.push({
        start: `${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}`,
        end: `${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`,
      });
    }
    return { date: query.date, durationMinutes: query.durationMinutes, slots };
  }

  async create(dto: CreateBookingDto, userId: string) {
    const court = await this.prisma.court.findUnique({
      where: { id: dto.courtId },
    });
    if (!court) {
      throw new NotFoundException('Sân thể thao không tồn tại');
    }
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new BadRequestException('Thời gian không hợp lệ');
    }
    // Kiểm tra thời gian
    if (startTime >= endTime) {
      throw new BadRequestException(
        'Thời gian bắt đầu phải trước thời gian kết thúc',
      );
    }
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / 60000;
    if (
      durationMinutes < MIN_BOOKING_MINUTES ||
      durationMinutes > MAX_BOOKING_MINUTES
    ) {
      throw new BadRequestException(
        `Thời lượng đặt sân phải từ ${MIN_BOOKING_MINUTES / 60} đến ${MAX_BOOKING_MINUTES / 60} giờ`,
      );
    }
    if (startTime < new Date()) {
      throw new BadRequestException(
        'Thời gian bắt đầu phải sau thời gian hiện tại',
      );
    }
    /*Kiểm tra giờ mở cửa*/
    const openMinutes = toMinutesOfDay(court.openTime);
    const closeMinutes = toMinutesOfDay(court.closeTime);
    if (openMinutes === null || closeMinutes === null) {
      throw new BadRequestException('Giờ mở cửa/kết thúc của sân không hợp lệ');
    }
    const bookingStartMinutes = getVietnamMinutes(startTime);
    const bookingEndMinutes = getVietnamMinutes(endTime);
    if (bookingStartMinutes < openMinutes || bookingEndMinutes > closeMinutes) {
      throw new BadRequestException(
        `Thời gian đặt sân không hợp lệ. Sân hoạt động từ ${court.openTime} đến ${court.closeTime}`,
      );
    }
    //kiểm tra booking bị trùng
    const existingConflict = await this.prisma.booking.findFirst({
      where: {
        courtId: dto.courtId,
        // CANCELLED và EXPIRED không giữ chỗ nữa: đơn hết hạn (cron) vẫn cho đặt lại.
        status: {
          notIn: ['CANCELLED', 'EXPIRED'],
        },
        startTime: {
          lt: endTime,
        },
        endTime: {
          gt: startTime,
        },
      },
    });
    if (existingConflict) {
      throw new ConflictException(
        'Sân đã có đơn đặt trong khoảng thời gian này',
      );
    }
    // tạo booking
    try {
      // Chốt giá tại thời điểm đặt: totalPrice = pricePerHour × số giờ (làm tròn
      // về nguyên đồng để tránh số lẻ khi thời lượng không chia hết cho 60 phút).
      const durationHours = new Prisma.Decimal(durationMinutes).div(60);
      const pricePerHour = court.pricePerHour;
      const booking = await this.prisma.booking.create({
        data: {
          courtId: dto.courtId,
          userId: userId,
          startTime: startTime,
          endTime: endTime,
          status: 'PENDING',
          pricePerHour: pricePerHour,
          totalPrice: pricePerHour.mul(durationHours).toDecimalPlaces(0),
        },
      });
      return booking;
    } catch (error) {
      if (isBookingOverlapViolation(error)) {
        throw new ConflictException(
          'Sân đã có đơn đặt trong khoảng thời gian này',
        );
      }
      throw error;
    }
  }
  // Lấy danh sách tất cả booking của chính user đang đăng nhập
  async findAll(userId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: { userId: userId },
      include: {
        court: true,
      },
      orderBy: { startTime: 'desc' },
    });
    return bookings;
  }
  // Lấy danh sách đơn đặt sân của một sân thuộc chủ sân đang đăng nhập
  async findByCourt(courtId: string, userId: string) {
    const court = await this.prisma.court.findUnique({
      where: { id: courtId },
    });
    if (!court || court.ownerId !== userId) {
      throw new NotFoundException(
        'Sân thể thao không tồn tại hoặc bạn không có quyền xem đơn đặt sân của sân này',
      );
    }
    return this.prisma.booking.findMany({
      where: { courtId: courtId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        court: true,
      },
      orderBy: { startTime: 'desc' },
    });
  }
  // Lấy chi tiết một booking cụ thể.
  async findOne(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        court: true,
      },
    });
    if (!booking || booking.userId !== userId) {
      throw new NotFoundException('Không tìm thấy đơn đặt sân này');
    }
    return booking;
  }
  // Hủy đơn đặt sân: cho phép khách đặt (chủ đơn) hoặc chủ sân (OWNER) hủy
  async cancel(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        court: true,
      },
    });
    const isBookingOwner = booking?.userId === userId;
    const isCourtOwner = booking?.court.ownerId === userId;
    if (!booking || (!isBookingOwner && !isCourtOwner)) {
      throw new NotFoundException(
        'Không tìm thấy đơn đặt sân này hoặc bạn không có quyền hủy',
      );
    }
    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('Đơn đặt sân này đã được hủy trước đó');
    }
    if (booking.status === 'EXPIRED') {
      throw new BadRequestException('Đơn đặt sân này đã hết hạn chờ xác nhận');
    }
    if (booking.status === 'COMPLETED') {
      throw new BadRequestException('Đơn đặt sân này đã hoàn thành');
    }
    if (booking.startTime <= new Date()) {
      throw new BadRequestException(
        'Không thể hủy đơn đặt sân đã bắt đầu hoặc đã qua',
      );
    }
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
      include: {
        court: true,
      },
    });
  }
  // Xác nhận đơn đặt sân: chỉ chủ sân (OWNER) mới có quyền xác nhận
  async confirm(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        court: true,
      },
    });
    if (!booking || booking.court.ownerId !== userId) {
      throw new NotFoundException(
        'Không tìm thấy đơn đặt sân này hoặc bạn không có quyền xác nhận',
      );
    }
    if (booking.status === 'EXPIRED') {
      throw new BadRequestException('Đơn đặt sân này đã hết hạn chờ xác nhận');
    }
    if (booking.status !== 'PENDING') {
      throw new BadRequestException(
        'Chỉ có thể xác nhận đơn đặt sân đang chờ xác nhận',
      );
    }
    // Cron chạy mỗi phút nên có thể chưa kịp chuyển trạng thái; không xác nhận
    // một đơn đã qua giờ bắt đầu.
    if (booking.startTime <= new Date()) {
      throw new BadRequestException(
        'Đơn đặt sân đã qua giờ bắt đầu, không thể xác nhận',
      );
    }
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED' },
      include: {
        court: true,
      },
    });
  }
}
