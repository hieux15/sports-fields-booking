'use client'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Ban, Clock3, MapPin, RefreshCw, Store } from 'lucide-react'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/api-error'
import { bookingStatusMeta } from '@/lib/booking-status'
import { formatDate, formatTimeRange, formatVND, hoursBetween } from '@/lib/format'
import type { BookingWithCourt } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

export default function BookingDetailClient({ id }: { id: string }) {
  const [booking, setBooking] = useState<BookingWithCourt | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const requestVersion = useRef(0)

  const canCancel = booking ? booking.status !== 'CANCELLED' && new Date(booking.startTime) > new Date() : false

  const load = useCallback(() => {
    const version = ++requestVersion.current
    setLoading(true)
    setLoadError(null)
    api
      .booking(id)
      .then(data => {
        if (version !== requestVersion.current) return
        setBooking(data)
      })
      .catch(e => {
        if (version === requestVersion.current) setLoadError(getErrorMessage(e))
      })
      .finally(() => {
        if (version === requestVersion.current) setLoading(false)
      })
  }, [id])

  useEffect(() => {
    load()
    return () => {
      requestVersion.current += 1
    }
  }, [load])

  const confirmCancel = async () => {
    if (!booking) return
    const previous = booking
    setSubmitting(true)
    setBooking(current => (current ? { ...current, status: 'CANCELLED' } : current))
    try {
      await api.cancelBooking(booking.id)
      toast.success('Đã hủy đơn đặt sân')
      setCancelling(false)
    } catch (e) {
      setBooking(previous)
      toast.error(getErrorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      </section>
    )
  }

  if (loadError || !booking) {
    return (
      <div role="alert" className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <Store className="mx-auto size-12 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-bold">Không tìm thấy đơn đặt sân</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {loadError ?? 'Đơn này có thể đã bị xóa hoặc không tồn tại.'}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="outline" nativeButton={false} render={<Link href="/bookings" />}>
            <ArrowLeft /> Về danh sách đơn
          </Button>
          <Button onClick={load}>
            <RefreshCw /> Thử lại
          </Button>
        </div>
      </div>
    )
  }

  const hours = Number(hoursBetween(booking.startTime, booking.endTime).toFixed(2))
  const currentPrice = Number(booking.court.pricePerHour)
  const snapshotPrice = Number(booking.pricePerHour)
  const priceChanged = currentPrice !== snapshotPrice
  const statusMeta = bookingStatusMeta(booking.status)

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Button variant="ghost" size="sm" className="mb-6" nativeButton={false} render={<Link href="/bookings" />}>
        <ArrowLeft /> Danh sách đơn
      </Button>

      <Card className="border-border shadow-none ring-1 ring-foreground/5">
        <CardHeader className="border-b border-border/80">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">Chi tiết đơn đặt sân</CardTitle>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${statusMeta.className}`}>
              <span className={`size-1.5 rounded-full ${statusMeta.dot}`} />
              {statusMeta.label}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Sân</p>
                <div className="mt-2 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <Store className="size-4 shrink-0 text-primary" />
                    <p className="font-semibold">{booking.court.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 shrink-0 text-primary" />
                    <p className="text-sm text-muted-foreground">
                      {booking.court.address || 'Chưa cập nhật địa chỉ'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Thời gian</p>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <Clock3 className="size-4 shrink-0 text-primary" />
                  <span>
                    {formatTimeRange(booking.startTime, booking.endTime)}
                    <span className="text-muted-foreground"> · {formatDate(booking.startTime)}</span>
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{hours} giờ</p>
              </div>
            </div>

            <div className="border-t border-border pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Giá tại thời điểm đặt</p>
              <div className="mt-3 flex flex-col gap-3 rounded-lg border border-border/80 bg-muted/40 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Đơn giá tại thời điểm đặt</span>
                  <span className="font-medium">{formatVND(snapshotPrice)}/giờ</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Thời lượng</span>
                  <span className="font-medium">{hours} giờ</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-2 text-base">
                  <span className="font-medium">Tổng tiền (đã chốt)</span>
                  <span className="font-bold text-primary">{formatVND(Number(booking.totalPrice))}</span>
                </div>
              </div>
            </div>

            {priceChanged && (
              <div className="border-t border-border pt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Giá hiện tại của sân (tham chiếu)</p>
                <div className="mt-3 flex flex-col gap-2 rounded-lg border border-border/80 bg-muted/40 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Giá hiện tại</span>
                    <span className="font-medium">{formatVND(currentPrice)}/giờ</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Giá hiện tại của sân đã thay đổi, nhưng đơn của bạn giữ nguyên giá tại thời điểm đặt.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={`/courts/${booking.courtId}`} />}
        >
          <Store /> Xem sân
        </Button>
        {canCancel && (
          <Button variant="destructive" onClick={() => setCancelling(true)}>
            <Ban /> Hủy đơn
          </Button>
        )}
      </div>

      <Dialog open={Boolean(cancelling)} onOpenChange={open => !open && setCancelling(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hủy đơn đặt sân?</DialogTitle>
            <DialogDescription>
              Đơn tại {booking.court.name} lúc {formatTimeRange(booking.startTime, booking.endTime)} ngày{' '}
              {formatDate(booking.startTime)} sẽ bị hủy. Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelling(false)} disabled={submitting}>
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
