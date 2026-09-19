'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw, Search, Store } from 'lucide-react'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/api-error'
import { COURT_TYPE_OPTIONS, normalizeType, type CourtTypeKey } from '@/lib/court-type'
import type { Court } from '@/lib/types'
import { CourtCard } from '@/components/court-card'
import { CourtListSkeleton } from '@/components/court-list-skeleton'
import { CourtsHero } from '@/components/courts-hero'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  /** Remount list on filter change so stagger animation replays. */
  const [listKey, setListKey] = useState(0)

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

  const setTypeFilter = (next: TypeFilter) => {
    setType(next)
    setListKey(k => k + 1)
  }

  return (
    <div>
      {/* First viewport: brand · headline · line · search · full-bleed photo */}
      <CourtsHero
        search={
          <>
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Tìm theo tên sân, địa chỉ, loại sân..."
              className="h-12 border-0 bg-white pl-11 text-foreground shadow-none placeholder:text-muted-foreground"
              aria-label="Tìm sân"
            />
          </>
        }
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="sticky top-14 z-30 -mx-4 mb-8 border-b border-border/80 bg-background/95 backdrop-blur sm:-mx-6">
          <div
            className="flex items-center gap-0 overflow-x-auto px-4 py-3 sm:px-6"
            role="group"
            aria-label="Lọc theo loại sân"
          >
            {TYPE_FILTERS.map(filter => {
              const active = type === filter.key
              return (
                <button
                  key={filter.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTypeFilter(filter.key)}
                  className={`relative shrink-0 px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
                    active
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {filter.label}
                  <span
                    className={`absolute inset-x-3 bottom-0 h-0.5 origin-left bg-primary transition-transform duration-300 sm:inset-x-4 ${
                      active ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />
                </button>
              )
            })}
          </div>
          {/* Fade gợi ý rằng bộ lọc còn cuộn ngang được trên màn nhỏ */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent md:hidden"
          />
        </div>

        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Danh sách sân</h2>
            <p aria-live="polite" className="text-sm text-muted-foreground">
              {loading
                ? 'Đang tải...'
                : hasFilter
                  ? `${filtered.length}/${courts.length} sân phù hợp`
                  : `${courts.length} sân`}
            </p>
          </div>
          {hasFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery('')
                setType('ALL')
                setListKey(k => k + 1)
              }}
            >
              <RefreshCw /> Xóa bộ lọc
            </Button>
          )}
        </div>

        {loading ? (
          <CourtListSkeleton count={4} />
        ) : error ? (
          <div
            role="alert"
            className="flex flex-col items-center gap-3 border border-border py-16 text-center"
          >
            <p className="font-semibold">Không tải được danh sách sân</p>
            <p className="max-w-md text-sm text-muted-foreground">{error}</p>
            <Button onClick={load} className="mt-2">
              <RefreshCw /> Thử lại
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 border border-dashed border-border py-16 text-center">
            <Store className="size-10 text-muted-foreground" />
            <p className="text-lg font-semibold">Không tìm thấy sân nào</p>
            <p className="text-sm text-muted-foreground">
              Thử đổi từ khóa hoặc bỏ bộ lọc loại sân.
            </p>
            {hasFilter && (
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => {
                  setQuery('')
                  setType('ALL')
                  setListKey(k => k + 1)
                }}
              >
                Xóa bộ lọc
              </Button>
            )}
          </div>
        ) : (
          <div key={listKey} className="flex flex-col">
            {filtered.map((court, index) => (
              <CourtCard key={court.id} court={court} index={index} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
