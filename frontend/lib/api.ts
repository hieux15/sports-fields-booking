import { mockBookings, mockCourts, mockUsers, courtDetail, ownerBookings } from './mock-data'
import type { BookingInput, BookingWithCourt, Court, CourtDetail, CourtInput, OwnerBooking, User } from './types'
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
function handleUnauthorized(path: string, hadToken: boolean) {
  if (!hadToken || path.startsWith('/auth/')) return
  clearSession()
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.assign('/login')
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = readToken()
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const body = parseBody(await res.text())
  if (!res.ok) {
    handleUnauthorized(path, Boolean(token))
    throw normalizeApiError(body ?? { message: res.statusText }, res.status)
  }
  return body as T
}
export const api = {
 async login(email: string, password: string) { if (useMock) { const user = mockUsers.find(u => u.email === email); if (!user || password !== '123456') throw new Error('Email hoặc mật khẩu không đúng'); return { access_token: `mock-${user.id}` } } return request<{ access_token: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }) },
 async register(data: { email: string; password: string; name: string }) { if (useMock) { if (mockUsers.some(u => u.email === data.email)) throw new Error('Email đã được sử dụng'); const user: User = { id: `mock-user-${Date.now()}`, email: data.email, name: data.name, phone: null, role: 'CUSTOMER', createdAt: new Date().toISOString() }; mockUsers.push(user); return user } return request<User>('/auth/register', { method: 'POST', body: JSON.stringify(data) }) },
 async becomeOwner(data: CourtInput) { if (useMock) { const user = { ...currentUser(), role: 'OWNER' as const }; const index = mockUsers.findIndex(item => item.id === user.id); if (index >= 0) mockUsers[index] = user; localStorage.setItem('sfb_user', JSON.stringify(user)); const court = { ...data, id: `court-${Date.now()}`, pricePerHour: String(data.pricePerHour), address: data.address || null, ownerId: user.id }; mockCourts.push(court); return { user, court } } return request<{ user: User; court: Court }>('/users/become-owner', { method: 'POST', body: JSON.stringify(data) }) },
 async me() { if (useMock) return currentUser(); return request<User>('/users/me') },
 async updateMe(data: { name?: string; phone?: string }) { if (useMock) { const user = { ...currentUser(), ...data }; localStorage.setItem('sfb_user', JSON.stringify(user)); return user } return request<User>('/users/me', { method: 'PATCH', body: JSON.stringify(data) }) },
 async courts() { if (useMock) return mockCourts; return request<Court[]>('/courts') },
 async myCourts() { if (useMock) return mockCourts.filter(c => c.ownerId === currentUser().id); return request<Court[]>('/courts/me') },
 async court(id: string) { if (useMock) { const c = mockCourts.find(c => c.id === id); if (!c) throw new Error('Không tìm thấy sân thể thao này'); return courtDetail(c) } return request<CourtDetail>(`/courts/${id}`) },
 async createCourt(data: CourtInput) { if (useMock) { const court = { ...data, id: `court-${Date.now()}`, pricePerHour: String(data.pricePerHour), address: data.address || null, ownerId: currentUser().id }; mockCourts.push(court); return court } return request<Court>('/courts', { method: 'POST', body: JSON.stringify(data) }) },
 async updateCourt(id: string, data: Partial<CourtInput>) { if (useMock) { const i = mockCourts.findIndex(c => c.id === id); mockCourts[i] = { ...mockCourts[i], ...data, pricePerHour: data.pricePerHour === undefined ? mockCourts[i].pricePerHour : String(data.pricePerHour) }; return mockCourts[i] } return request<Court>(`/courts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }) },
 async deleteCourt(id: string) { if (useMock) { const i = mockCourts.findIndex(c => c.id === id); mockCourts.splice(i, 1); return { success: true, message: 'Đã xóa sân' } } return request<{ success: true; message: string }>(`/courts/${id}`, { method: 'DELETE' }) },
 async createBooking(data: BookingInput) { if (useMock) { const court = mockCourts.find(c => c.id === data.courtId)!; const booking = { id: `booking-${Date.now()}`, ...data, userId: currentUser().id, status: 'PENDING' as const, isPaid: false, createdAt: new Date().toISOString(), court }; mockBookings.unshift(booking); return booking } return request('/bookings', { method: 'POST', body: JSON.stringify(data) }) },
 async myBookings() { if (useMock) return mockBookings.filter(b => b.userId === currentUser().id); return request<BookingWithCourt[]>('/bookings/me') },
 async cancelBooking(id: string) { if (useMock) { const b = mockBookings.find(b => b.id === id); if (!b) throw new Error('Không tìm thấy đơn'); b.status = 'CANCELLED'; return b } return request<BookingWithCourt>(`/bookings/${id}/cancel`, { method: 'PATCH' }) },
 async confirmBooking(id: string) { if (useMock) { const b = mockBookings.find(b => b.id === id); if (!b) throw new Error('Không tìm thấy đơn'); b.status = 'CONFIRMED'; return b } return request<BookingWithCourt>(`/bookings/${id}/confirm`, { method: 'PATCH' }) },
 async courtBookings(id: string) { if (useMock) return ownerBookings(id); return request<OwnerBooking[]>(`/courts/${id}/bookings`) },
}
