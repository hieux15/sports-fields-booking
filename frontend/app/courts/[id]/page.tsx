import type { Metadata } from 'next'
import CourtDetailClient from './court-detail-client'
export const metadata: Metadata = { title: 'Chi tiết sân | Sân Việt', description: 'Xem thông tin và đặt lịch sân thể thao.' }
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <CourtDetailClient id={id} /> }
