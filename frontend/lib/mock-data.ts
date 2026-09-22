import type { BookingWithCourt, Court, CourtDetail, OwnerBooking, User } from './types'
const now = new Date()
const iso = (days: number, hour: number) => { const d = new Date(now); d.setDate(d.getDate() + days); d.setHours(hour, 0, 0, 0); return d.toISOString() }
export const mockUsers: User[] = [
 { id: 'u-customer', email: 'customer@test.com', name: 'Minh Anh', phone: '0901234567', role: 'CUSTOMER', createdAt: now.toISOString() },
 { id: 'u-owner', email: 'owner@test.com', name: 'Sân thể thao Green Field', phone: '0912345678', role: 'OWNER', createdAt: now.toISOString() },
]
export const mockCourts: Court[] = [
 { id: 'court-1', name: 'Green Field 01', type: 'Bóng đá', address: '123 Nguyễn Trãi, Thanh Xuân, Hà Nội', pricePerHour: '200000', openTime: '06:00', closeTime: '22:00', ownerId: 'u-owner' },
 { id: 'court-2', name: 'Green Field 02', type: 'Bóng đá', address: '123 Nguyễn Trãi, Thanh Xuân, Hà Nội', pricePerHour: '240000', openTime: '06:00', closeTime: '22:00', ownerId: 'u-owner' },
 { id: 'court-3', name: 'Smash Zone', type: 'Cầu lông', address: '45 Lê Văn Lương, Cầu Giấy, Hà Nội', pricePerHour: '100000', openTime: '07:00', closeTime: '23:00', ownerId: 'u-owner' },
 { id: 'court-4', name: 'Ace Tennis Club', type: 'Tennis', address: '28 Hồ Tây, Tây Hồ, Hà Nội', pricePerHour: '180000', openTime: '06:00', closeTime: '21:00', ownerId: 'u-owner' },
]
export const mockBookings: BookingWithCourt[] = [{ id: 'booking-1', courtId: 'court-1', userId: 'u-customer', startTime: iso(2, 18), endTime: iso(2, 20), status: 'CONFIRMED', pricePerHour: '200000', totalPrice: '400000', createdAt: now.toISOString(), court: mockCourts[0] }]
export function courtDetail(court: Court): CourtDetail { const owner = mockUsers.find(u => u.id === court.ownerId)!; return { ...court, owner: { name: owner.name, phone: owner.phone } } }
export function ownerBookings(courtId: string): OwnerBooking[] { return mockBookings.filter(b => b.courtId === courtId).map(b => ({ ...b, user: { id: 'u-customer', name: 'Minh Anh', phone: '0901234567', email: 'customer@test.com' } })) }
