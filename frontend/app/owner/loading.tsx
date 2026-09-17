import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Skeleton className="h-9 w-52" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <Skeleton className="mt-8 h-56 rounded-xl" />
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-52 rounded-xl" />
        <Skeleton className="h-52 rounded-xl" />
      </div>
    </section>
  )
}