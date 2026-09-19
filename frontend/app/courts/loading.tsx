import { CourtListSkeleton } from '@/components/court-list-skeleton'
import { CourtsHero } from '@/components/courts-hero'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Khung xương cho route /courts. Dùng lại hero thật + danh sách skeleton giống
 * trang chính để không có màn hình giả khác bố cục (tránh nhấp nháy).
 */
export default function Loading() {
  return (
    <>
      <CourtsHero animated={false} search={<Skeleton className="h-12 w-full bg-white/25" />} />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Thanh lọc theo loại sân */}
        <div className="-mx-4 mb-8 border-b border-border/80 px-4 py-3 sm:-mx-6 sm:px-6">
          <Skeleton className="h-8 w-full max-w-md" />
        </div>

        {/* Tiêu đề danh sách + số lượng sân */}
        <div className="mb-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-2 h-5 w-24" />
        </div>

        <CourtListSkeleton count={4} />
      </section>
    </>
  )
}
