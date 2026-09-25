'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RefreshCw,
  Store,
} from 'lucide-react'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/api-error'
import { bookingStatusMeta } from '@/lib/booking-status'
import { bookingTotal, isConfirmedBooking } from '@/lib/booking-utils'
import { courtTypeMeta } from '@/lib/court-type'
import { CourtImage } from '@/components/court-image'
import { formatDate, formatTimeRange, formatVND, hoursBetween } from '@/lib/format'
import type { CourtDetail, OwnerBooking } from '@/lib/types'
import { useAuth } from '@/components/auth-provider'
import { Badge } from '@/components/ui/badge'
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

export default function CourtManageClient({ id }: { id: string }) {
  const { user, loading: authLoading } = useAuth()
  const [court, setCourt] = useState<CourtDetail | null>(null)
  const [bookings, setBookings] = useState<OwnerBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [upcomingOnly, setUpcomingOnly] = useState(false)
  const [confirming, setConfirming] = useState<{
    booking: OwnerBooking
    action: 'confirm' | 'cancel'
  } | null>(null)

  const load = useCallback(() => {
    if (!user || user.role !== 'OWNER') return
    setLoading(true)
    setError(null)
    Promise.all([api.court(id), api.courtBookings(id)])
      .then(([courtData, bookingList]) => {
        setCourt(courtData)
        setBookings(bookingList)
      })
      .catch(e => setError(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [id, user])

  useEffect(() => {
    if (!authLoading) load()
  }, [authLoading, load])

  const visible = useMemo(() => {
    const list = upcomingOnly
      ? bookings.filter(item => new Date(item.endTime) > new Date())
      : bookings
    return [...list].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    )
  }, [bookings, upcomingOnly])

  const stats = useMemo(
    () => ({
      total: bookings.length,
      pending: bookings.filter(item => item.status === 'PENDING').length,
      confirmed: bookings.filter(item => item.status === 'CONFIRMED').length,
      completed: bookings.filter(item => item.status === 'COMPLETED').length,
      cancelled: bookings.filter(item => item.status === 'CANCELLED').length,
      expired: bookings.filter(item => item.status === 'EXPIRED').length,
      revenue: bookings.filter(isConfirmedBooking).reduce((sum, item) => sum + bookingTotal(item), 0),
    }),
    [bookings],
  )

  const updateStatus = async (booking: OwnerBooking, action: 'confirm' | 'cancel') => {
    setPendingAction(`${booking.id}-${action}`)
    const previous = bookings
    setBookings(current =>
      current.map(item =>
        item.id === booking.id
          ? { ...item, status: action === 'confirm' ? ('CONFIRMED' as const) : ('CANCELLED' as const) }
          : item,
      ),
    )
    try {
      if (action === 'confirm') {
        await api.confirmBooking(booking.id)
        toast.success('Đã xác nhận đơn đặt sân')
      } else {
        await api.cancelBooking(booking.id)
        toast.success('Đã hủy đơn đặt sân')
      }
    } catch (e) {
      setBookings(previous)
      toast.error(getErrorMessage(e))
    } finally {
      setPendingAction(null)
    }
  }

  const requestAction = (booking: OwnerBooking, action: 'confirm' | 'cancel') => {
    setConfirming({ booking, action })
  }

  const executeConfirmedAction = async () => {
    if (!confirming) return
    await updateStatus(confirming.booking, confirming.action)
    setConfirming(null)
  }

  if (!authLoading && (!user || user.role !== 'OWNER')) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <Store className="mx-auto size-12 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-bold">Khu vực dành cho chủ sân</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Đăng nhập bằng tài khoản chủ sân để quản lý đơn đặt sân của sân này.
        </p>
        <Button className="mt-6" nativeButton={false} render={<Link href="/login" />}>
          Đăng nhập
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-9 w-64" />
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </section>
    )
  }

  if (error || !court) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <Store className="mx-auto size-12 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-bold">Không tải được sân này</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error ?? 'Sân không tồn tại hoặc không thuộc quyền quản lý của bạn.'}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="outline" nativeButton={false} render={<Link href="/owner" />}>
            <ArrowLeft /> Về tổng quan
          </Button>
          <Button onClick={load}>
            <RefreshCw /> Thử lại
          </Button>
        </div>
      </div>
    )
  }

  const meta = courtTypeMeta(court.type)
  const Icon = meta.icon

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Link
        href="/owner"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Về tổng quan
      </Link>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="relative flex size-14 items-center justify-center overflow-hidden rounded-2xl bg-muted text-white">
            <CourtImage
              court={court}
              sizes="56px"
              className="absolute inset-0 size-full object-cover"
            />
            <span className={`absolute inset-0 ${meta.overlay}`} />
            <Icon className="relative size-7" />
          </span>
          <div>
            <h1 className="text-2xl font-bold">{court.name}</h1>
            <p className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5" /> {court.address || 'Chưa cập nhật địa chỉ'}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock3 className="size-3.5" /> {court.openTime} – {court.closeTime}
              </span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" onClick={load}>
            <RefreshCw /> Làm mới
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/owner/courts/${id}/edit`} />}
          >
            <Pencil /> Sửa sân
          </Button>
          <Button variant="outline" nativeButton={false} render={<Link href={`/courts/${id}`} />}>
            Xem trang khách
          </Button>
        </div>
      </div>
      <div className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-border py-3 text-sm">
        <span>
          <strong className="text-foreground">{stats.total}</strong>{' '}
          <span className="text-muted-foreground">tổng đơn</span>
        </span>
        <span>
          <strong className="text-amber-700">{stats.pending}</strong>{' '}
          <span className="text-muted-foreground">chờ xác nhận</span>
        </span>
        <span>
          <strong className="text-emerald-700">{stats.confirmed}</strong>{' '}
          <span className="text-muted-foreground">đã xác nhận</span>
        </span>
        <span>
          <strong className="text-sky-700">{stats.completed}</strong>{' '}
          <span className="text-muted-foreground">đã hoàn thành</span>
        </span>
        <span className="text-muted-foreground">
          Doanh thu ghi nhận (xác nhận + hoàn thành):{' '}
          <strong className="text-foreground">{formatVND(stats.revenue)}</strong>
        </span>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Đơn đặt sân</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {upcomingOnly ? 'Đang hiển thị các đơn chưa kết thúc.' : 'Xếp theo thời gian bắt đầu.'}
          </p>
        </div>
        <Button
          variant={upcomingOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUpcomingOnly(value => !value)}
        >
          {upcomingOnly ? 'Đang lọc: đơn sắp tới' : 'Chỉ hiện đơn sắp tới'}
        </Button>
      </div>

      <div className="border-y border-border">
        {visible.length === 0 ? (
          <p className="border-b border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            {upcomingOnly ? 'Không có đơn sắp tới.' : 'Chưa có đơn đặt sân nào.'}
          </p>
        ) : (
          visible.map(booking => (
            <BookingRow
              key={booking.id}
              booking={booking}
              pendingAction={pendingAction}
              onAction={requestAction}
            />
          ))
        )}
      </div>

      <ConfirmActionDialog
        confirming={confirming}
        submitting={Boolean(pendingAction)}
        onClose={() => setConfirming(null)}
        onConfirm={executeConfirmedAction}
      />
    </section>
  )
}

function BookingRow({
  booking,
  pendingAction,
  onAction,
}: {
  booking: OwnerBooking
  pendingAction: string | null
  onAction: (booking: OwnerBooking, action: 'confirm' | 'cancel') => void
}) {
  const statusMeta = bookingStatusMeta(booking.status)
  const isConfirming = pendingAction === `${booking.id}-confirm`
  const isCancelling = pendingAction === `${booking.id}-cancel`

  return (
    <div className="grid gap-4 border-b border-border px-3 py-4 last:border-b-0 sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:items-center sm:px-4">
      <div>
        <p className="text-base font-bold tracking-tight">{formatTimeRange(booking.startTime, booking.endTime)}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatDate(booking.startTime)} · {hoursBetween(booking.startTime, booking.endTime)} giờ
        </p>
      </div>
      <div className="min-w-0 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{booking.user.name}</p>
          <Badge variant="outline" className={statusMeta.className}>
            <span className={`size-1.5 rounded-full ${statusMeta.dot}`} />
            {statusMeta.label}
          </Badge>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
          {booking.user.phone && (
            <a href={`tel:${booking.user.phone}`} className="flex items-center gap-1.5 hover:text-foreground">
              <Phone className="size-3.5" /> {booking.user.phone}
            </a>
          )}
          {booking.user.email && (
            <a href={`mailto:${booking.user.email}`} className="flex items-center gap-1.5 hover:text-foreground">
              <Mail className="size-3.5" /> {booking.user.email}
            </a>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
        <span className="font-semibold text-primary">{formatVND(bookingTotal(booking))}</span>
        {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
          <div className="flex gap-2">
            {booking.status === 'PENDING' && (
              <Button size="sm" onClick={() => onAction(booking, 'confirm')} disabled={isConfirming}>
                <CheckCircle2 />
                {isConfirming ? 'Đang xử lý...' : 'Xác nhận'}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => onAction(booking, 'cancel')}
              disabled={isCancelling}
            >
              <Ban />
              {isCancelling ? 'Đang hủy...' : 'Hủy đơn'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function ConfirmActionDialog({
  confirming,
  submitting,
  onClose,
  onConfirm,
}: {
  confirming: { booking: OwnerBooking; action: 'confirm' | 'cancel' } | null
  submitting: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  if (!confirming) return null
  const { booking, action } = confirming
  const isConfirm = action === 'confirm'
  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isConfirm ? 'Xác nhận đơn đặt sân?' : 'Hủy đơn đặt sân?'}</DialogTitle>
          <DialogDescription>
            {isConfirm
              ? `Đơn tại ${booking.court.name} lúc ${formatTimeRange(
                  booking.startTime,
                  booking.endTime,
                )} ngày ${formatDate(booking.startTime)} sẽ được xác nhận.`
              : `Đơn tại ${booking.court.name} lúc ${formatTimeRange(
                  booking.startTime,
                  booking.endTime,
                )} ngày ${formatDate(booking.startTime)} sẽ bị hủy. Hành động này không thể hoàn tác.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Đóng
          </Button>
          <Button variant={isConfirm ? 'default' : 'destructive'} onClick={onConfirm} disabled={submitting}>
            {submitting ? 'Đang xử lý...' : isConfirm ? 'Xác nhận' : 'Xác nhận hủy'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
