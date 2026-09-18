import { hoursBetween } from '@/lib/format'
import type { BookingStatus, BookingWithCourt, OwnerBooking } from '@/lib/types'

type PricedBooking = Pick<BookingWithCourt | OwnerBooking, 'startTime' | 'endTime' | 'status'> & {
  court: { pricePerHour: string }
}

export function bookingTotal(booking: PricedBooking) {
  return hoursBetween(booking.startTime, booking.endTime) * Number(booking.court.pricePerHour)
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