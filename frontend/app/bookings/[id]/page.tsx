import BookingDetailClient from './booking-detail-client'
export const metadata = { title: 'Chi tiết đơn đặt sân | Sân Việt', description: 'Xem chi tiết đơn đặt sân và giá tại thời điểm đặt.' }
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <BookingDetailClient id={id} />
}
