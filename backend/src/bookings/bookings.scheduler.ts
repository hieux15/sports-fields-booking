import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Cron tự chuyển trạng thái đơn đặt sân để slot không bị giữ vô hạn thời gian:
 *
 * - `PENDING` quá giờ bắt đầu mà chủ sân chưa xác nhận → `EXPIRED`
 *   (giải phóng slot để khách khác đặt lại, kể cả trong ràng buộc chống trùng giờ).
 * - `CONFIRMED` qua giờ kết thúc → `COMPLETED` (lưu lịch sử cho dashboard doanh thu).
 *
 * Chạy mỗi phút một lần; các lệnh updateMany đều idempotent nên chạy lại an toàn.
 */
@Injectable()
export class BookingsScheduler {
  private readonly logger = new Logger(BookingsScheduler.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE, { name: 'expireBookings' })
  async handleExpiredBookings() {
    await this.sweepBookingStatuses();
  }

  /**
   * Một lần quét: trả về số đơn đã chuyển cho mỗi chiều để test/log dùng lại được.
   * Nhận `now` tường minh để unit test không cần fake đồng hệ thống.
   */
  async sweepBookingStatuses(now: Date = new Date()) {
    const [expired, completed] = await this.prisma.$transaction([
      this.prisma.booking.updateMany({
        where: { status: 'PENDING', startTime: { lte: now } },
        data: { status: 'EXPIRED' },
      }),
      this.prisma.booking.updateMany({
        where: { status: 'CONFIRMED', endTime: { lte: now } },
        data: { status: 'COMPLETED' },
      }),
    ]);

    if (expired.count > 0 || completed.count > 0) {
      this.logger.log(
        `Booking sweep: ${expired.count} PENDING → EXPIRED, ${completed.count} CONFIRMED → COMPLETED`,
      );
    }

    return { expired: expired.count, completed: completed.count };
  }
}
