import type { Metadata } from 'next'
import { NewCourtClient } from './new-court-client'

export const metadata: Metadata = {
  title: 'Thêm sân mới | Sân Việt',
  description: 'Tạo sân thể thao mới để bắt đầu nhận đơn đặt sân.',
}

export default function Page() {
  return <NewCourtClient />
}