'use client'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Ban, CalendarDays, Clock3, MapPin, RefreshCw, Search, Store, ArrowRight } from 'lucide-react'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/api-error'
import { bookingStatusMeta } from '@/lib/booking-status'
import { bookingTotal, isCancellableBooking, isActiveBooking, isUpcomingBooking } from '@/lib/booking-utils'
import { formatDate, formatTimeRange, formatVND } from '@/lib/format'
import type { BookingStatus, BookingWithCourt } from '@/lib/types'
import { useAuth } from '@/components/auth-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

type StatusFilter = 'ALL' | BookingStatus

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'PENDING', label: 'Chờ xác nhận' },
  { key: 'CONFIRMED', label: 'Đã xác nhận' },
  { key: 'COMPLETED', label: 'Đã hoàn thành' },
  { key: 'CANCELLED', label: 'Đã hủy' },
  { key: 'EXPIRED', label: 'Đã hết hạn' },
]

const BOOKING_GROUPS = [
  { key: 'today', label: 'Hôm nay' },
  { key: 'upcoming', label: 'Sắp tới' },
  { key: 'past', label: 'Đã qua' },
] as const

function bookingGroup(startTime: string) {
  const start = new Date(startTime)
  const now = new Date()
  const isToday =
    start.getFullYear() === now.getFullYear() &&
    start.getMonth() === now.getMonth() &&
    start.getDate() === now.getDate()

  if (isToday) return 'today'
  return start > now ? 'upcoming' : 'past'
}

export default function BookingsPage() {
  const { user, loading: authLoading } = useAuth()
  const [items, setItems] = useState<BookingWithCourt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<StatusFilter>('ALL')
  const [cancelling, setCancelling] = useState<BookingWithCourt | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(() => {
    if (!user) return
    setLoading(true)
    setError(null)
    api
      .myBookings()
      .then(setItems)
      .catch(e => setError(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    if (!authLoading) load()
  }, [authLoading, load])

  const filtered = useMemo(
    () => (status === 'ALL' ? items : items.filter(item => item.status === status)),
    [items, status]
  )

  const grouped = useMemo(
    () =>
      BOOKING_GROUPS.map(group => ({
        ...group,
        items: filtered
          .filter(item => bookingGroup(item.startTime) === group.key)
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
      })).filter(group => group.items.length > 0),
    [filtered]
  )

  const counts = useMemo(
    () => ({
      upcoming: items.filter(item => isUpcomingBooking(item)).length,
      pending: items.filter(item => item.status === 'PENDING').length,
      spent: items
        .filter(item => isActiveBooking(item))
        .reduce((sum, item) => sum + bookingTotal(item), 0),
    }),
    [items]
  )

  const canCancel = (booking: BookingWithCourt) => isCancellableBooking(booking)

  const confirmCancel = async () => {
    if (!cancelling) return
    const previous = items
    setSubmitting(true)
    setItems(current =>
      current.map(item =>
        item.id === cancelling.id ? { ...item, status: 'CANCELLED' as const } : item
      )
    )
    try {
      await api.cancelBooking(cancelling.id)
      toast.success('Đã hủy đơn đặt sân')
      setCancelling(null)
    } catch (e) {
      setItems(previous)
      toast.error(getErrorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }
  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <CalendarDays className="mx-auto size-12 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-bold">Bạn cần đăng nhập</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Đăng nhập để xem và quản lý các đơn đặt sân của bạn.
        </p>
        <Button className="mt-6" nativeButton={false} render={<Link href="/login" />}>
          Đăng nhập
        </Button>
      </div>
    )
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Lịch của bạn</p>
        <h1 className="mt-1 text-3xl font-bold">Đơn đặt sân</h1>
        <p className="mt-2 text-muted-foreground">
          Theo dõi, hủy và kiểm tra trạng thái các lịch chơi của bạn.
        </p>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-border py-3 text-sm">
        <span>
          <strong className="text-foreground">{counts.upcoming}</strong>{' '}
          <span className="text-muted-foreground">lịch sắp tới</span>
        </span>
        <span>
          <strong className="text-amber-700">{counts.pending}</strong>{' '}
          <span className="text-muted-foreground">đơn chờ xác nhận</span>
        </span>
        <span className="text-muted-foreground">
          Tổng giá trị đơn chưa hủy: <strong className="text-foreground">{formatVND(counts.spent)}</strong>
        </span>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map(filter => (
          <button
            key={filter.key}
            type="button"
            onClick={() => setStatus(filter.key)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              status === filter.key
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-muted-foreground hover:border-primary hover:text-primary'
            }`}
          >
            {filter.label}
            {filter.key !== 'ALL' && (
              <span className="ml-1.5 text-xs opacity-80">
                {items.filter(item => item.status === filter.key).length}
              </span>
            )}
          </button>
        ))}
        <Button variant="ghost" size="sm" className="ml-auto" onClick={load}>
          <RefreshCw /> Làm mới
        </Button>
      </div>
      {loading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      ) : error ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <p className="font-semibold">Không tải được danh sách đơn</p>
            <p className="max-w-md text-sm text-muted-foreground">{error}</p>
            <Button onClick={load} className="mt-2">
              <RefreshCw /> Thử lại
            </Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <CalendarDays className="size-10 text-muted-foreground" />
            <p className="text-lg font-semibold">
              {items.length === 0
                ? 'Bạn chưa có lịch đặt sân'
                : 'Không có đơn nào ở trạng thái này'}
            </p>
            <p className="text-sm text-muted-foreground">
              {items.length === 0
                ? 'Hãy khám phá sân gần bạn và bắt đầu một trận đấu.'
                : 'Thử chọn trạng thái khác để xem các đơn còn lại.'}
            </p>
            {items.length === 0 && (
              <Button className="mt-3" nativeButton={false} render={<Link href="/courts" />}>
                <Search /> Tìm sân ngay
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-8">
          {grouped.map(group => (
            <section key={group.key}>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  {group.label}
                </h2>
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="border-y border-border">
                {group.items.map((item, index) => {
                  const meta = bookingStatusMeta(item.status)
                  const isFeatured = index === 0 && group.key !== 'past'
                  return (
                    <div
                      key={item.id}
                      className={`grid gap-4 border-b border-border px-3 py-4 last:border-b-0 sm:grid-cols-[8rem_minmax(0,1fr)_auto] sm:items-center sm:px-4 ${
                        isFeatured ? 'bg-primary/5' : 'bg-background'
                      }`}
                    >
                      <div>
                        <p className="text-lg font-bold tracking-tight text-foreground">
                          {formatTimeRange(item.startTime, item.endTime)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(item.startTime)}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold">{item.court.name}</p>
                          <Badge variant="outline" className={meta.className}>
                            <span className={`size-1.5 rounded-full ${meta.dot}`} />
                            {meta.label}
                          </Badge>
                        </div>
                        <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                          <MapPin className="size-3.5 shrink-0" />
                          {item.court.address || 'Chưa cập nhật địa chỉ'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                        <p className="font-semibold text-primary">{formatVND(bookingTotal(item))}</p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            nativeButton={false}
                            render={<Link href={`/bookings/${item.id}`} />}
                          >
                            <ArrowRight /> Chi tiết
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            nativeButton={false}
                            render={<Link href={`/courts/${item.courtId}`} />}
                          >
                            <Store /> Xem sân
                          </Button>
                          {canCancel(item) && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setCancelling(item)}
                            >
                              <Ban /> Hủy đơn
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <Dialog open={Boolean(cancelling)} onOpenChange={open => !open && setCancelling(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hủy đơn đặt sân?</DialogTitle>
            <DialogDescription>
              {cancelling
                ? `Đơn tại ${cancelling.court.name} lúc ${formatTimeRange(
                    cancelling.startTime,
                    cancelling.endTime
                  )} ngày ${formatDate(cancelling.startTime)} sẽ bị hủy. Hành động này không thể hoàn tác.`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelling(null)} disabled={submitting}>
              Giữ đơn
            </Button>
            <Button variant="destructive" onClick={confirmCancel} disabled={submitting}>
              {submitting ? 'Đang hủy...' : 'Xác nhận hủy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}