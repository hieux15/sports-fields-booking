import { Skeleton } from '@/components/ui/skeleton'
export default function Loading() { return <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6"><Skeleton className="h-10 w-64" /><Skeleton className="mt-3 h-5 w-96 max-w-full" /><div className="mt-8 flex flex-col gap-4"><Skeleton className="h-48 rounded-xl" /><Skeleton className="h-48 rounded-xl" /></div></section> }
