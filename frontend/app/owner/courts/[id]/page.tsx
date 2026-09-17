import type { Metadata } from 'next'
import CourtManageClient from './court-manage-client'

export const metadata: Metadata = {
  title: 'Quản lý đơn đặt sân | Sân Việt',
  description: 'Xác nhận và hủy đơn đặt sân của sân bạn quản lý.',
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CourtManageClient id={id} />
}