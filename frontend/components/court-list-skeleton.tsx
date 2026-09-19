import { Skeleton } from '@/components/ui/skeleton'

/**
 * Khung xương cho danh sách sân (ảnh + tên + địa chỉ + giá).
 * Dùng chung giữa `app/courts/loading.tsx` và trạng thái đang tải trong trang
 * để hai chỗ không lệch bố cục. Trang trí thuần tuý nên ẩn với screen reader.
 */
export function CourtListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div aria-hidden className="flex flex-col divide-y divide-border/80">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="grid gap-4 py-6 sm:grid-cols-[220px_1fr] sm:gap-6">
          <Skeleton className="aspect-[16/10] w-full sm:aspect-auto sm:h-[140px]" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}