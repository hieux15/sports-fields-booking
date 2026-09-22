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
  return booking.status !== 'CANCELLED' && new Date(booking.startTime) > new Date()
}

export function isActiveBooking(booking: Pick<PricedBooking, 'status'>) {
  return booking.status !== 'CANCELLED'
}

export function isConfirmedBooking(booking: Pick<PricedBooking, 'status'>) {
  return booking.status === 'CONFIRMED'
}

export function statusCount(bookings: Pick<PricedBooking, 'status'>[], status: BookingStatus) {
  return bookings.filter(booking => booking.status === status).length
}