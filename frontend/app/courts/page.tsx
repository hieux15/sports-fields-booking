'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw, Search, SlidersHorizontal, Sparkles, Store } from 'lucide-react'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/api-error'
import { COURT_TYPE_OPTIONS, normalizeType, type CourtTypeKey } from '@/lib/court-type'
import type { Court } from '@/lib/types'
import { CourtCard } from '@/components/court-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

type TypeFilter = 'ALL' | CourtTypeKey

const TYPE_FILTERS: { key: TypeFilter; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  ...COURT_TYPE_OPTIONS.map(option => ({ key: option.key as TypeFilter, label: option.label })),
]

export default function CourtsPage() {
  const [courts, setCourts] = useState<Court[]>([])
  const [query, setQuery] = useState('')
  const [type, setType] = useState<TypeFilter>('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    api
      .courts()
      .then(setCourts)
      .catch(e => {
        const message = getErrorMessage(e)
        setError(message)
        toast.error(message)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return courts.filter(court => {
      if (type !== 'ALL' && normalizeType(court.type) !== type) return false
      if (!keyword) return true
      return [court.name, court.address ?? '', court.type].some(value =>
        value.toLowerCase().includes(keyword)
      )
    })
  }, [courts, query, type])

  const hasFilter = query.trim().length > 0 || type !== 'ALL'
return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-600 to-teal-400 px-4 py-14 text-white sm:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_55%)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <Badge className="mb-4 border-0 bg-white/15 text-white">
              <Sparkles /> Đặt sân thật dễ
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Tìm sân, đặt lịch,
              <br />
              <span className="text-emerald-100">chơi hết mình.</span>
            </h1>
            <p className="mt-4 max-w-lg text-base text-emerald-50/90">
              Khám phá những sân thể thao chất lượng quanh bạn và đặt lịch chỉ trong vài thao tác.
            </p>
          </div>
          <div className="relative mt-8 max-w-xl">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Tìm theo tên sân, địa chỉ, loại sân..."
              className="h-14 border-0 bg-white pl-11 text-foreground shadow-xl placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="sticky top-16 z-30 -mx-4 mb-7 border-b bg-slate-50/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <SlidersHorizontal className="size-4 shrink-0 text-muted-foreground" />
            {TYPE_FILTERS.map(filter => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setType(filter.key)}
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${
                  type === filter.key
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-primary hover:text-primary'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Danh sách sân</h2>
            <p className="text-sm text-muted-foreground">
              {loading ? 'Đang tải dữ liệu...' : `${filtered.length}/${courts.length} sân phù hợp`}
            </p>
          </div>
          {hasFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery('')
                setType('ALL')
              }}
            >
              <RefreshCw /> Xóa bộ lọc
            </Button>
          )}
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-80 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <Card className="shadow-sm">
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="font-semibold">Không tải được danh sách sân</p>
              <p className="max-w-md text-sm text-muted-foreground">{error}</p>
              <Button onClick={load} className="mt-2">
                <RefreshCw /> Thử lại
              </Button>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed shadow-none">
            <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
              <Store className="size-10 text-muted-foreground" />
              <p className="text-lg font-semibold">Không tìm thấy sân nào</p>
              <p className="text-sm text-muted-foreground">
                Thử đổi từ khóa hoặc bỏ bộ lọc loại sân để xem toàn bộ danh sách.
              </p>
              {hasFilter && (
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={() => {
                    setQuery('')
                    setType('ALL')
                  }}
                >
                  Xóa bộ lọc
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(court => (
              <CourtCard key={court.id} court={court} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
