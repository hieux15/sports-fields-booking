import { Skeleton } from '@/components/ui/skeleton'
export default function BookingDetailLoading() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Skeleton className="mb-6 h-8 w-48" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    </section>
  )
}
