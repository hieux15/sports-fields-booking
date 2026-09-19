import type { Metadata } from 'next'
import { OwnerSetupClient } from './owner-setup-client'

export const metadata: Metadata = {
  title: 'Đăng ký sân | Sân Việt',
  description: 'Tạo sân đầu tiên để bắt đầu quản lý lịch đặt sân.',
}

export default function Page() {
  return <OwnerSetupClient />
}
