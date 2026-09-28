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

type SortableBooking = { startTime: string; status: BookingStatus; createdAt: string }

/** Chủ sân xử lý đơn chờ gần nhất trước; lịch sắp tới tiếp theo, lịch sử ở cuối. */
export function sortOwnerBookings<T extends SortableBooking>(bookings: T[], now = Date.now()) {
  const priority = (booking: SortableBooking) => {
    const isFuture = new Date(booking.startTime).getTime() > now
    if (booking.status === 'PENDING' && isFuture) return 0
    if (booking.status === 'CONFIRMED' && isFuture) return 1
    if (booking.status === 'PENDING') return 2
    if (booking.status === 'COMPLETED') return 3
    if (booking.status === 'CANCELLED') return 4
    return 5 // EXPIRED
  }

  return [...bookings].sort((a, b) => {
    const priorityDifference = priority(a) - priority(b)
    if (priorityDifference !== 0) return priorityDifference

    const aStart = new Date(a.startTime).getTime()
    const bStart = new Date(b.startTime).getTime()
    const ascending = priority(a) <= 1 || (priority(a) === 2 && aStart > now)
    const timeDifference = ascending ? aStart - bStart : bStart - aStart
    if (timeDifference !== 0) return timeDifference
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}
