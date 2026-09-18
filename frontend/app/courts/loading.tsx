import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <>
      <section className="relative min-h-[min(72vh,560px)] overflow-hidden bg-foreground/90">
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/30" />
        <div className="relative mx-auto flex min-h-[min(72vh,560px)] max-w-7xl flex-col justify-end px-4 pb-12 pt-20 sm:px-6 sm:pb-16">
          <Skeleton className="h-12 w-48 bg-white/20 sm:h-16 sm:w-64" />
          <Skeleton className="mt-4 h-8 w-full max-w-md bg-white/20" />
          <Skeleton className="mt-3 h-5 w-full max-w-sm bg-white/15" />
          <Skeleton className="mt-8 h-12 w-full max-w-xl bg-white/25" />
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Skeleton className="mb-8 h-10 w-full max-w-lg" />
        <div className="flex flex-col divide-y divide-border/80">
          {Array.from({ length: 4 }).map((_, index) => (
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
      </section>
    </>
  )
}
