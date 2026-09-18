import Link from 'next/link'
import { ArrowUpRight, Clock3, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { courtTypeMeta } from '@/lib/court-type'
import { formatVND } from '@/lib/format'
import type { Court } from '@/lib/types'

export function CourtCard({ court }: { court: Court }) {
  const meta = courtTypeMeta(court.type)
  const Icon = meta.icon

  return (
    <Card className="h-full gap-0 py-0 shadow-sm ring-1 ring-foreground/5 transition duration-200 hover:-translate-y-1 hover:shadow-xl">
      <div
        className="relative flex h-36 items-end bg-cover bg-center p-5 text-white"
        style={{ backgroundImage: `url(${meta.image})` }}
      >
        <div className={`absolute inset-0 ${meta.overlay}`} />
        <span className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
          <Icon className="size-6" />
        </span>
        <div className="relative">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white/75">
            {meta.label}
          </p>
          <h3 className="mt-1 line-clamp-1 text-xl font-semibold">{court.name}</h3>
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col gap-3 pb-5">
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
          <span className="line-clamp-2">{court.address || 'Chưa cập nhật địa chỉ'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock3 className="size-4 shrink-0 text-primary" />
          <span>
            Mở cửa {court.openTime} – {court.closeTime}
          </span>
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 border-t pt-4">
          <div>
            <p className="text-xs text-muted-foreground">Giá thuê</p>
            <p className="text-lg font-bold text-primary">
              {formatVND(Number(court.pricePerHour))}
              <span className="text-sm font-normal text-muted-foreground">/giờ</span>
            </p>
          </div>
          <Badge variant="secondary" className="mb-1">
            {meta.label}
          </Badge>
        </div>
        <Button
          className="w-full"
          nativeButton={false}
          render={<Link href={`/courts/${court.id}`} />}
        >
          Xem &amp; đặt sân
          <ArrowUpRight data-icon="inline-end" />
        </Button>
      </CardContent>
    </Card>
  )
}
