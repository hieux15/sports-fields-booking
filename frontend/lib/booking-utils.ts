import type { BookingStatus, BookingWithCourt, OwnerBooking } from '@/lib/types'

type PricedBooking = Pick<BookingWithCourt | OwnerBooking, 'startTime' | 'endTime' | 'status' | 'totalPrice'>

/**
 * Tổng tiền của một đơn = `totalPrice` chốt **tại thời điểm đặt sân**, nên chủ
 * sân có đổi `pricePerHour` sau này cũng không làm lệch doanh thu quá khứ.
 */
export function bookingTotal(booking: PricedBooking) {
  return Number(booking.totalPrice)
}

export function isUpcomingBooking(booking: Pick<PricedBooking, 'startTime' | 'status'>) {
  return isActiveBooking(booking) && new Date(booking.startTime) > new Date()
}

/**
 * Đơn "còn hiệu lực": chỉ loại CANCELLED và EXPIRED (đơn đã nhả slot).
 * COMPLETED vẫn được tính vì là lịch sử đã ghi nhận.
 */
export function isActiveBooking(booking: Pick<PricedBooking, 'status'>) {
  return booking.status !== 'CANCELLED' && booking.status !== 'EXPIRED'
}

/**
 * Doanh thu = đơn đã xác nhận, kể cả COMPLETED — đây chính là "lịch sử doanh thu"
 * mà cron tạo ra khi CONFIRMED qua giờ kết thúc.
 */
export function isConfirmedBooking(booking: Pick<PricedBooking, 'status'>) {
  return booking.status === 'CONFIRMED' || booking.status === 'COMPLETED'
}

/** Chỉ đơn còn hiệu lực và chưa qua giờ bắt đầu mới được phép hủy. */
export function isCancellableBooking(booking: Pick<PricedBooking, 'startTime' | 'status'>) {
  return isActiveBooking(booking) && new Date(booking.startTime) > new Date()
}

export function statusCount(bookings: Pick<PricedBooking, 'status'>[], status: BookingStatus) {
  return bookings.filter(booking => booking.status === status).length
}