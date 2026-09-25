import type { BookingWithCourt, Court, CourtDetail, OwnerBooking, Review, User } from './types'
const now = new Date()
const iso = (days: number, hour: number) => { const d = new Date(now); d.setDate(d.getDate() + days); d.setHours(hour, 0, 0, 0); return d.toISOString() }
export const mockUsers: User[] = [
 { id: 'u-customer', email: 'customer@test.com', name: 'Minh Anh', phone: '0901234567', role: 'CUSTOMER', createdAt: now.toISOString() },
 { id: 'u-owner', email: 'owner@test.com', name: 'Sân thể thao Green Field', phone: '0912345678', role: 'OWNER', createdAt: now.toISOString() },
 { id: 'u-customer-2', email: 'customer2@test.com', name: 'Hoàng Nam', phone: '0911111111', role: 'CUSTOMER', createdAt: new Date(Date.now() - 86400000 * 30).toISOString() },
 { id: 'u-customer-3', email: 'customer3@test.com', name: 'Thảo Vy', phone: '0922222222', role: 'CUSTOMER', createdAt: new Date(Date.now() - 86400000 * 20).toISOString() },
 { id: 'u-customer-4', email: 'customer4@test.com', name: 'Đức Anh', phone: '0933333333', role: 'CUSTOMER', createdAt: new Date(Date.now() - 86400000 * 10).toISOString() },
]
/** Ảnh demo khác nhau cho từng sân, để chế độ mock cũng không bị trùng ảnh. */
const MOCK_COURT_IMAGE = (photoId: string) =>
  `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1400&q=80`

export const mockCourts: Court[] = [
 { id: 'court-1', name: 'Green Field 01', type: 'FOOTBALL', address: '123 Nguyễn Trãi, Thanh Xuân, Hà Nội', imageUrl: MOCK_COURT_IMAGE('1459865264687-595d652de67e'), pricePerHour: '200000', openTime: '06:00', closeTime: '22:00', ownerId: 'u-owner', avgRating: 4.3, reviews: [
  { id: 'review-1', userId: 'u-customer', courtId: 'court-1', rating: 4, comment: 'Sân đẹp, giá tốt', userName: 'Minh Anh', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'review-2', userId: 'u-customer-2', courtId: 'court-1', rating: 5, comment: 'Cỏ tốt, không bị lầy', userName: 'Hoàng Nam', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'review-3', userId: 'u-customer-3', courtId: 'court-1', rating: 4, comment: null, userName: 'Thảo Vy', createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
 ] },
 { id: 'court-2', name: 'Green Field 02', type: 'FOOTBALL', address: '123 Nguyễn Trãi, Thanh Xuân, Hà Nội', imageUrl: MOCK_COURT_IMAGE('1529900748604-07564a03e7a6'), pricePerHour: '240000', openTime: '06:00', closeTime: '22:00', ownerId: 'u-owner', avgRating: 3.8, reviews: [
  { id: 'review-4', userId: 'u-customer-4', courtId: 'court-2', rating: 4, comment: 'Sân rộng, thoáng mát', userName: 'Đức Anh', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'review-5', userId: 'u-customer-3', courtId: 'court-2', rating: 3, comment: 'Cần khắc phục hệ thống thoát nước', userName: 'Thảo Vy', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
 ] },
 { id: 'court-3', name: 'Smash Zone', type: 'BADMINTON', address: '45 Lê Văn Lương, Cầu Giấy, Hà Nội', imageUrl: MOCK_COURT_IMAGE('1626224583764-f87db24ac4ea'), pricePerHour: '100000', openTime: '07:00', closeTime: '23:00', ownerId: 'u-owner', avgRating: 4.5, reviews: [
  { id: 'review-6', userId: 'u-customer-2', courtId: 'court-3', rating: 5, comment: 'Sân đẹp, đèn sáng, rất thích', userName: 'Hoàng Nam', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'review-7', userId: 'u-customer', courtId: 'court-3', rating: 4, comment: 'Giá hợp lý', userName: 'Minh Anh', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
 ] },
 { id: 'court-4', name: 'Ace Tennis Club', type: 'TENNIS', address: '28 Hồ Tây, Tây Hồ, Hà Nội', imageUrl: MOCK_COURT_IMAGE('1531315630201-bb15abeb1653'), pricePerHour: '180000', openTime: '06:00', closeTime: '21:00', ownerId: 'u-owner', avgRating: 4.7, reviews: [
  { id: 'review-8', userId: 'u-customer-4', courtId: 'court-4', rating: 5, comment: 'Mặt sân đẹp, dịch vụ tốt', userName: 'Đức Anh', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'review-9', userId: 'u-customer-2', courtId: 'court-4', rating: 5, comment: null, userName: 'Hoàng Nam', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'review-10', userId: 'u-customer-3', courtId: 'court-4', rating: 4, comment: 'Cần thêm bóng nước uống', userName: 'Thảo Vy', createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
 ] },
]
export const mockBookings: BookingWithCourt[] = [
 { id: 'booking-1', courtId: 'court-1', userId: 'u-customer', startTime: iso(-2, 18), endTime: iso(-2, 20), status: 'COMPLETED', pricePerHour: '200000', totalPrice: '400000', createdAt: new Date(Date.now() - 86400000).toISOString(), court: { ...mockCourts[0], pricePerHour: String(mockCourts[0].pricePerHour) } },
 { id: 'booking-2', courtId: 'court-2', userId: 'u-customer', startTime: iso(-1, 18), endTime: iso(-1, 20), status: 'PENDING', pricePerHour: '240000', totalPrice: '480000', createdAt: new Date(Date.now() - 43200000).toISOString(), court: { ...mockCourts[1], pricePerHour: String(mockCourts[1].pricePerHour) } },
 { id: 'booking-3', courtId: 'court-2', userId: 'u-customer-2', startTime: iso(-5, 18), endTime: iso(-5, 20), status: 'COMPLETED', pricePerHour: '240000', totalPrice: '480000', createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), court: { ...mockCourts[1], pricePerHour: String(mockCourts[1].pricePerHour) } },
 { id: 'booking-4', courtId: 'court-3', userId: 'u-customer-2', startTime: iso(-3, 18), endTime: iso(-3, 20), status: 'COMPLETED', pricePerHour: '100000', totalPrice: '200000', createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), court: { ...mockCourts[2], pricePerHour: String(mockCourts[2].pricePerHour) } },
 { id: 'booking-5', courtId: 'court-3', userId: 'u-customer', startTime: iso(-4, 18), endTime: iso(-4, 20), status: 'COMPLETED', pricePerHour: '100000', totalPrice: '200000', createdAt: new Date(Date.now() - 86400000 * 4).toISOString(), court: { ...mockCourts[2], pricePerHour: String(mockCourts[2].pricePerHour) } },
 { id: 'booking-6', courtId: 'court-4', userId: 'u-customer-4', startTime: iso(-2, 18), endTime: iso(-2, 20), status: 'COMPLETED', pricePerHour: '180000', totalPrice: '360000', createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), court: { ...mockCourts[3], pricePerHour: String(mockCourts[3].pricePerHour) } },
 { id: 'booking-7', courtId: 'court-4', userId: 'u-customer-2', startTime: iso(-5, 18), endTime: iso(-5, 20), status: 'COMPLETED', pricePerHour: '180000', totalPrice: '360000', createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), court: { ...mockCourts[3], pricePerHour: String(mockCourts[3].pricePerHour) } },
 { id: 'booking-8', courtId: 'court-4', userId: 'u-customer-3', startTime: iso(-6, 18), endTime: iso(-6, 20), status: 'COMPLETED', pricePerHour: '180000', totalPrice: '360000', createdAt: new Date(Date.now() - 86400000 * 6).toISOString(), court: { ...mockCourts[3], pricePerHour: String(mockCourts[3].pricePerHour) } },
]
export function courtDetail(court: Court): CourtDetail { const owner = mockUsers.find(u => u.id === court.ownerId)!; return { ...court, owner: { name: owner.name, phone: owner.phone } } }
export function ownerBookings(courtId: string): OwnerBooking[] { return mockBookings.filter(b => b.courtId === courtId).map(b => ({ ...b, user: { id: 'u-customer', name: 'Minh Anh', phone: '0901234567', email: 'customer@test.com' } })) }
