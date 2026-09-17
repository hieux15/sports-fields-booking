import type { BookingStatus } from './types'

export type BookingStatusMeta = {
  label: string
  /** Class cho Badge (viền + màu chữ + nền nhạt). */
  className: string
  /** Class màu cho chấm trạng thái. */
  dot: string
  /** Class cho cột Kanban ở trang quản lý của chủ sân. */
  column: string
}

export const BOOKING_STATUS_META: Record<BookingStatus, BookingStatusMeta> = {
  PENDING: {
    label: 'Chờ xác nhận',
    className: 'border-amber-200 bg-amber-100 text-amber-800',
    dot: 'bg-amber-500',
    column: 'border-amber-200 bg-amber-50/60',
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    className: 'border-emerald-200 bg-emerald-100 text-emerald-800',
    dot: 'bg-emerald-500',
    column: 'border-emerald-200 bg-emerald-50/60',
  },
  CANCELLED: {
    label: 'Đã hủy',
    className: 'border-slate-200 bg-slate-100 text-slate-600',
    dot: 'bg-slate-400',
    column: 'border-slate-200 bg-slate-100/60',
  },
}

/** Nhãn tiếng Việt cho trạng thái đơn đặt sân (API trả về chữ hoa). */
export function bookingStatusMeta(status: BookingStatus): BookingStatusMeta {
  return BOOKING_STATUS_META[status] ?? BOOKING_STATUS_META.PENDING
}
