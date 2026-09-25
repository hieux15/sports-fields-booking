'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, RefreshCw, Search, Store } from 'lucide-react'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/api-error'
import { COURT_TYPE_OPTIONS, type CourtTypeKey } from '@/lib/court-type'
import type { Court, CourtSort } from '@/lib/types'
import { CourtCard } from '@/components/court-card'
import { CourtListSkeleton } from '@/components/court-list-skeleton'
import { CourtsHero } from '@/components/courts-hero'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

type TypeFilter = 'ALL' | CourtTypeKey

const TYPE_FILTERS: { key: TypeFilter; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  ...COURT_TYPE_OPTIONS.map(option => ({ key: option.key as TypeFilter, label: option.label })),
]

const SORT_OPTIONS: { value: CourtSort; label: string }[] = [
  { value: 'name_asc', label: 'Tên A → Z' },
  { value: 'price_asc', label: 'Giá thấp → cao' },
  { value: 'price_desc', label: 'Giá cao → thấp' },
]

/** Số sân mỗi trang. */
const PAGE_SIZE = 6
/** Chờ người dùng ngừng gõ rồi mới gọi API để không spam request. */
const SEARCH_DEBOUNCE_MS = 350

export default function CourtsPage() {
  const [courts, setCourts] = useState<Court[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [query, setQuery] = useState('')
  /** Từ khóa đã debounce — giá trị thực sự gửi lên server. */
  const [search, setSearch] = useState('')
  const [type, setType] = useState<TypeFilter>('ALL')
  const [sort, setSort] = useState<CourtSort>('name_asc')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  /** Remount list on filter change so stagger animation replays. */
  const [listKey, setListKey] = useState(0)
  /** Bỏ qua kết quả của request cũ khi người dùng đổi bộ lọc liên tục. */
  const requestVersion = useRef(0)

  // Mỗi lần đổi từ khóa đều quay về trang 1 sau khi ngừng gõ.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(query.trim())
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query])

  const load = useCallback(() => {
    const version = ++requestVersion.current
    setLoading(true)
    setError(null)
    api
      .courts({
        q: search || undefined,
        type: type === 'ALL' ? undefined : type,
        page,
        limit: PAGE_SIZE,
        sort,
      })
      .then(data => {
        if (version !== requestVersion.current) return
        // Bộ lọc mới ít trang hơn: quay về trang 1 thay vì hiện trang trống.
        if (data.items.length === 0 && data.page > 1) {
          setPage(1)
          return
        }
        setCourts(data.items)
        setTotal(data.total)
        setTotalPages(data.totalPages)
        setListKey(key => key + 1)
      })
      .catch(e => {
        if (version !== requestVersion.current) return
        const message = getErrorMessage(e)
        setError(message)
        toast.error(message)
      })
      .finally(() => {
        if (version === requestVersion.current) setLoading(false)
      })
  }, [page, search, sort, type])

  useEffect(() => {
    load()
  }, [load])

  const hasFilter = search.length > 0 || type !== 'ALL'

  const clearFilters = () => {
    setQuery('')
    setType('ALL')
    setPage(1)
  }

  const goToPage = (next: number) => {
    setPage(next)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div>
      {/* First viewport: brand · headline · line · search · full-bleed photo */}
      <CourtsHero
        search={
          <div
            role="search"
            className="group relative max-w-xl rounded-full border border-white/75 bg-background/90 p-1 shadow-[0_10px_26px_rgba(0,0,0,0.16)] backdrop-blur-md transition-colors focus-within:border-primary/70 focus-within:bg-background"
          >
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-primary transition-transform group-focus-within:scale-110" />
            <Input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Tìm sân hoặc khu vực..."
              className="h-12 rounded-full border-0 bg-transparent pl-11 pr-5 text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
              aria-label="Tìm sân hoặc khu vực"
            />
          </div>
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
                  onClick={() => {
                    setType(filter.key)
                    setPage(1)
                  }}
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
            className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-l from-background to-transparent md:hidden"
          />
        </div>

        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Danh sách sân</h2>
            <p aria-live="polite" className="text-sm text-muted-foreground">
              {loading
                ? 'Đang tải...'
                : hasFilter
                  ? `${total} sân phù hợp`
                  : `${total} sân`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              items={SORT_OPTIONS}
              value={sort}
              onValueChange={value => {
                if (!value) return
                setSort(value as CourtSort)
                setPage(1)
              }}
            >
              <SelectTrigger aria-label="Sắp xếp danh sách sân" className="h-9 w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilter && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <RefreshCw /> Xóa bộ lọc
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <CourtListSkeleton count={PAGE_SIZE} />
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
        ) : courts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 border border-dashed border-border py-16 text-center">
            <Store className="size-10 text-muted-foreground" />
            <p className="text-lg font-semibold">Không tìm thấy sân nào</p>
            <p className="text-sm text-muted-foreground">
              Thử đổi từ khóa hoặc bỏ bộ lọc loại sân.
            </p>
            {hasFilter && (
              <Button variant="outline" className="mt-3" onClick={clearFilters}>
                Xóa bộ lọc
              </Button>
            )}
          </div>
        ) : (
          <>
            <div key={listKey} className="flex flex-col">
              {courts.map((court, index) => (
                <CourtCard key={court.id} court={court} index={index} />
              ))}
            </div>

            {totalPages > 1 && (
              <nav
                aria-label="Phân trang danh sách sân"
                className="mt-8 flex items-center justify-center gap-3"
              >
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                >
                  <ChevronLeft /> Trước
                </Button>
                <span aria-live="polite" className="text-sm text-muted-foreground">
                  Trang {page}/{totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => goToPage(page + 1)}
                >
                  Sau <ChevronRight />
                </Button>
              </nav>
            )}
          </>
        )}
      </section>
    </div>
  )
}

