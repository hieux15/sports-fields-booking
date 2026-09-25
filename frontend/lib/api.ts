import { mockBookings, mockCourts, mockUsers, courtDetail, ownerBookings } from './mock-data'
import type { BookingInput, BookingWithCourt, Court, CourtAvailability, CourtDetail, CourtInput, CourtQuery, OwnerBooking, Paginated, User } from './types'
import { normalizeApiError } from './api-error'
import { clearSession, readToken } from './session'
const useMock = process.env.NEXT_PUBLIC_USE_MOCK === '1'
const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
const currentUser = () => { if (typeof window === 'undefined') return mockUsers[0]; const raw = localStorage.getItem('sfb_user'); return raw ? JSON.parse(raw) as User : mockUsers[0] }

function parseBody(text: string): unknown {
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return { message: text }
  }
}

/** Token hết hạn: xóa phiên và đưa người dùng về trang đăng nhập. */
function handleUnauthorized(path: string, hadToken: boolean, status: number) {
  if (status !== 401 || !hadToken || path.startsWith('/auth/')) return
  clearSession()
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.assign('/login')
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = readToken()
  // FormData phải để trình duyệt tự gắn Content-Type kèm boundary, nếu tự set
  // 'application/json' thì body multipart bị hiểu sai và API trả 400.
  const isFormData = options.body instanceof FormData
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const body = parseBody(await res.text())
  if (!res.ok) {
    handleUnauthorized(path, Boolean(token), res.status)
    throw normalizeApiError(body ?? { message: res.statusText }, res.status)
  }
  return body as T
}

/** Bỏ tham số rỗng để URL gọn (`?q=&page=1` là nhiễu). */
function toQueryString(query: CourtQuery) {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value))
  })
  const search = params.toString()
  return search ? `?${search}` : ''
}

/**
 * Bắt chước `GET /courts` (lọc + sắp xếp + phân trang) cho chế độ mock, để
 * trang chạy được khi không có backend mà vẫn đúng shape dữ liệu như thật.
 */
function paginateCourts(query: CourtQuery): Paginated<Court> {
  const keyword = query.q?.trim().toLowerCase() ?? ''
  const type = query.type
  const page = query.page ?? 1
  const limit = query.limit ?? 12

  const matched = mockCourts.filter(court => {
    const haystack = `${court.name} ${court.address ?? ''}`.toLowerCase()
    if (keyword && !haystack.includes(keyword)) return false
    if (type && court.type !== type) return false
    const price = Number(court.pricePerHour)
    if (query.minPrice !== undefined && price < query.minPrice) return false
    if (query.maxPrice !== undefined && price > query.maxPrice) return false
    return true
  })

  const sorted = [...matched].sort((a, b) => {
    switch (query.sort) {
      case 'price_asc':
        return Number(a.pricePerHour) - Number(b.pricePerHour)
      case 'price_desc':
        return Number(b.pricePerHour) - Number(a.pricePerHour)
      case 'name_desc':
        return b.name.localeCompare(a.name)
      default:
        return a.name.localeCompare(b.name)
    }
  })

  return {
    items: sorted.slice((page - 1) * limit, page * limit),
    total: sorted.length,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(sorted.length / limit)),
  }
}

export const api = {

 async login(email: string, password: string) { if (useMock) { const user = mockUsers.find(u => u.email === email); if (!user || password !== '123456') throw new Error('Email hoặc mật khẩu không đúng'); return { access_token: `mock-${user.id}` } } return request<{ access_token: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }) },
 async register(data: { email: string; password: string; name: string }) { if (useMock) { if (mockUsers.some(u => u.email === data.email)) throw new Error('Email đã được sử dụng'); const user: User = { id: `mock-user-${Date.now()}`, email: data.email, name: data.name, phone: null, role: 'CUSTOMER', createdAt: new Date().toISOString() }; mockUsers.push(user); return user } return request<User>('/auth/register', { method: 'POST', body: JSON.stringify(data) }) },
 async becomeOwner(data: CourtInput) { if (useMock) { const user = { ...currentUser(), role: 'OWNER' as const }; const index = mockUsers.findIndex(item => item.id === user.id); if (index >= 0) mockUsers[index] = user; localStorage.setItem('sfb_user', JSON.stringify(user)); const court = { ...data, id: `court-${Date.now()}`, pricePerHour: String(data.pricePerHour), address: data.address || null, imageUrl: data.imageUrl ?? null, ownerId: user.id }; mockCourts.push(court); return { user, court } } return request<{ user: User; court: Court }>('/users/become-owner', { method: 'POST', body: JSON.stringify(data) }) },
 async me() { if (useMock) return currentUser(); return request<User>('/users/me') },
 async updateMe(data: { name?: string; phone?: string }) { if (useMock) { const user = { ...currentUser(), ...data }; localStorage.setItem('sfb_user', JSON.stringify(user)); return user } return request<User>('/users/me', { method: 'PATCH', body: JSON.stringify(data) }) },
 async courts(query: CourtQuery = {}) { if (useMock) return paginateCourts(query); return request<Paginated<Court>>(`/courts${toQueryString(query)}`) },
 async myCourts() { if (useMock) return mockCourts.filter(c => c.ownerId === currentUser().id); return request<Court[]>('/courts/me') },
 async court(id: string) { if (useMock) { const c = mockCourts.find(c => c.id === id); if (!c) throw new Error('Không tìm thấy sân thể thao này'); return courtDetail(c) } return request<CourtDetail>(`/courts/${id}`) },
 async courtAvailability(id: string, date: string, durationMinutes: number) {
  if (useMock) {
   const court = mockCourts.find(item => item.id === id)
   if (!court) throw new Error('Không tìm thấy sân thể thao này')
   const [openHour, openMinute] = court.openTime.split(':').map(Number)
   const [closeHour, closeMinute] = court.closeTime.split(':').map(Number)
   const open = openHour * 60 + openMinute
   const close = closeHour * 60 + closeMinute
   const day = new Date(`${date}T00:00:00+07:00`)
   const now = Date.now()
   const slots: CourtAvailability['slots'] = []
   for (let start = open; start + durationMinutes <= close; start += 30) {
    const startTime = new Date(day.getTime() + start * 60_000)
    const endTime = new Date(day.getTime() + (start + durationMinutes) * 60_000)
    const occupied = mockBookings.some(booking => booking.courtId === id && booking.status !== 'CANCELLED' && new Date(booking.startTime) < endTime && new Date(booking.endTime) > startTime)
    if (startTime.getTime() <= now || occupied) continue
    const time = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
    slots.push({ start: time(start), end: time(start + durationMinutes) })
   }
   return { date, durationMinutes, slots }
  }
  return request<CourtAvailability>(`/courts/${id}/availability?${new URLSearchParams({ date, durationMinutes: String(durationMinutes) })}`)
 },
 async createCourt(data: CourtInput) { if (useMock) { const court = { ...data, id: `court-${Date.now()}`, pricePerHour: String(data.pricePerHour), address: data.address || null, imageUrl: data.imageUrl ?? null, ownerId: currentUser().id }; mockCourts.push(court); return court } return request<Court>('/courts', { method: 'POST', body: JSON.stringify(data) }) },
 async updateCourt(id: string, data: Partial<CourtInput>) { if (useMock) { const i = mockCourts.findIndex(c => c.id === id); mockCourts[i] = { ...mockCourts[i], ...data, pricePerHour: data.pricePerHour === undefined ? mockCourts[i].pricePerHour : String(data.pricePerHour), imageUrl: data.imageUrl === undefined ? mockCourts[i].imageUrl : data.imageUrl }; return mockCourts[i] } return request<Court>(`/courts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }) },
 async deleteCourt(id: string) { if (useMock) { const i = mockCourts.findIndex(c => c.id === id); mockCourts.splice(i, 1); return { success: true, message: 'Đã xóa sân' } } return request<{ success: true; message: string }>(`/courts/${id}`, { method: 'DELETE' }) },
 /**
  * Upload ảnh sân thật (multipart). Trả `imageUrl` để gửi kèm khi tạo/sửa sân.
  * Chế độ mock không có backend nên trả blob URL của chính file vừa chọn — đủ để
  * xem trước giao diện, không bền qua lần tải lại trang.
  */
 async uploadCourtImage(file: File) { if (useMock) return { imageUrl: URL.createObjectURL(file) }; const form = new FormData(); form.append('file', file); return request<{ imageUrl: string }>('/courts/images', { method: 'POST', body: form }) },
 async createBooking(data: BookingInput) { if (useMock) { const court = mockCourts.find(c => c.id === data.courtId)!; const hours = (new Date(data.endTime).getTime() - new Date(data.startTime).getTime()) / 3600000; const booking = { id: `booking-${Date.now()}`, ...data, userId: currentUser().id, status: 'PENDING' as const, pricePerHour: court.pricePerHour, totalPrice: String(hours * Number(court.pricePerHour)), createdAt: new Date().toISOString(), court }; mockBookings.unshift(booking); return booking } return request('/bookings', { method: 'POST', body: JSON.stringify(data) }) },
  async booking(id: string) { if (useMock) { const b = mockBookings.find(b => b.id === id); if (!b) throw new Error('Không tìm thấy đơn đặt sân'); return b } return request<BookingWithCourt>(`/bookings/${id}`) },
  async myBookings() { if (useMock) return mockBookings.filter(b => b.userId === currentUser().id); return request<BookingWithCourt[]>('/bookings/me') },
 async cancelBooking(id: string) { if (useMock) { const b = mockBookings.find(b => b.id === id); if (!b) throw new Error('Không tìm thấy đơn'); b.status = 'CANCELLED'; return b } return request<BookingWithCourt>(`/bookings/${id}/cancel`, { method: 'PATCH' }) },
 async confirmBooking(id: string) { if (useMock) { const b = mockBookings.find(b => b.id === id); if (!b) throw new Error('Không tìm thấy đơn'); b.status = 'CONFIRMED'; return b } return request<BookingWithCourt>(`/bookings/${id}/confirm`, { method: 'PATCH' }) },
 async courtBookings(id: string) { if (useMock) return ownerBookings(id); return request<OwnerBooking[]>(`/courts/${id}/bookings`) },
}
