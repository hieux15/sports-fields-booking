import Link from 'next/link'
import { ArrowUpRight, Clock3, MapPin } from 'lucide-react'
import { courtTypeMeta } from '@/lib/court-type'
import { formatVND } from '@/lib/format'
import type { Court } from '@/lib/types'

export function CourtCard({
  court,
  index = 0,
}: {
  court: Court
  /** Stagger index for list fade-in on filter change. */
  index?: number
}) {
  const meta = courtTypeMeta(court.type)

  return (
    <article
      className="court-list-item group border-b border-border/80 last:border-b-0"
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <Link
        href={`/courts/${court.id}`}
        className="grid gap-4 py-6 sm:grid-cols-[minmax(0,220px)_1fr] sm:items-stretch sm:gap-6"
      >
        <div className="relative aspect-[16/10] overflow-hidden sm:aspect-auto sm:min-h-[140px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={meta.image}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
          <div className={`absolute inset-0 ${meta.overlay}`} />
          <span className="absolute bottom-3 left-3 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white/85">
            {meta.label}
          </span>
        </div>

        <div className="flex min-w-0 flex-col justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-2xl">
              {court.name}
            </h3>
            <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="line-clamp-2">{court.address || 'Chưa cập nhật địa chỉ'}</span>
            </p>
            <p className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock3 className="size-4 shrink-0 text-primary" />
              <span>
                Mở cửa {court.openTime} – {court.closeTime}
              </span>
            </p>
          </div>

          <div className="flex items-end justify-between gap-3">
            <p className="text-lg font-bold text-accent-foreground">
              {formatVND(Number(court.pricePerHour))}
              <span className="text-sm font-normal text-muted-foreground">/giờ</span>
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
              Xem &amp; đặt
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  )
}
