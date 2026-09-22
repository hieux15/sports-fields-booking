export type Role = 'OWNER' | 'CUSTOMER'
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED'
export type User = { id: string; email: string; name: string; phone: string | null; role: Role; createdAt: string }
export type Court = { id: string; name: string; type: string; address: string | null; pricePerHour: string; openTime: string; closeTime: string; ownerId: string }
export type CourtDetail = Court & { owner: { name: string; phone: string | null } }
export type Booking = { id: string; courtId: string; userId: string; startTime: string; endTime: string; status: BookingStatus; pricePerHour: string; totalPrice: string; createdAt: string }
export type BookingWithCourt = Booking & { court: Court }
export type OwnerBooking = Booking & { court: Court; user: { id: string; name: string; phone: string | null; email: string } }
export type CourtInput = { name: string; type: string; address?: string; pricePerHour: number; openTime: string; closeTime: string }
export type BookingInput = { courtId: string; startTime: string; endTime: string }
export type Session = { token: string; user: User }

/** Thứ tự sắp xếp mà `GET /courts?sort=` chấp nhận. */
export type CourtSort = 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc'

/** Query string của `GET /courts` — mọi trường đều tuỳ chọn. */
export type CourtQuery = {
  q?: string
  type?: string
  minPrice?: number
  maxPrice?: number
  page?: number
  limit?: number
  sort?: CourtSort
}

/** Vỏ bọc mà mọi endpoint danh sách có phân trang trả về. */
export type Paginated<T> = {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
export const COURT_TYPES = ['Bóng đá', 'Cầu lông', 'Tennis', 'Pickleball', 'Bóng rổ', 'Khác']
export const BOOKING_STATUSES: BookingStatus[] = ['PENDING', 'CONFIRMED', 'CANCELLED']

export function isOwner(user: User | null): boolean { return user?.role === 'OWNER' }
export function isCustomer(user: User | null): boolean { return user?.role === 'CUSTOMER' }
export function normalizeApiError(error: unknown): string { return error instanceof Error ? error.message : 'Có lỗi xảy ra. Vui lòng thử lại.' }
