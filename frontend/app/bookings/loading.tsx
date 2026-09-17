import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-4 h-9 w-64" />
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <div className="mt-8 flex flex-col gap-4">
        <Skeleton className="h-44 rounded-xl" />
        <Skeleton className="h-44 rounded-xl" />
      </div>
    </section>
  )
}