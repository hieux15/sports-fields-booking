import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <>
      <section className="bg-gradient-to-br from-emerald-800 via-emerald-600 to-teal-400 px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <Skeleton className="h-6 w-32 bg-white/25" />
          <Skeleton className="mt-5 h-12 w-full max-w-xl bg-white/25" />
          <Skeleton className="mt-3 h-12 w-full max-w-md bg-white/25" />
          <Skeleton className="mt-8 h-14 w-full max-w-xl bg-white/25" />
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Skeleton className="mb-6 h-8 w-40" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-80 rounded-xl" />
          ))}
        </div>
      </section>
    </>
  )
}