import type { Metadata } from 'next'
import { EditCourtClient } from './edit-court-client'

export const metadata: Metadata = {
  title: 'Sửa thông tin sân | Sân Việt',
  description: 'Cập nhật giá, khung giờ hoạt động và địa chỉ của sân.',
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <EditCourtClient id={id} />
}