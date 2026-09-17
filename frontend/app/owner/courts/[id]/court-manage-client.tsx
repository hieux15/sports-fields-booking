'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Ban,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RefreshCw,
  Store,
  TrendingUp,
} from 'lucide-react'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/api-error'
import { bookingStatusMeta } from '@/lib/booking-status'
import { courtTypeMeta } from '@/lib/court-type'
import { formatDate, formatTimeRange, formatVND, hoursBetween } from '@/lib/format'
import type { BookingStatus, CourtDetail, OwnerBooking } from '@/lib/types'
import { useAuth } from '@/components/auth-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

const COLUMNS: { status: BookingStatus; title: string }[] = [
  { status: 'PENDING', title: 'Chờ xác nhận' },
  { status: 'CONFIRMED', title: 'Đã xác nhận' },
  { status: 'CANCELLED', title: 'Đã hủy' },
]

function bookingTotal(booking: OwnerBooking) {
  return hoursBetween(booking.startTime, booking.endTime) * Number(booking.court.pricePerHour)
}

export default function CourtManageClient({ id }: { id: string }) {
  const { user, loading: authLoading } = useAuth()
  const [court, setCourt] = useState<CourtDetail | null>(null)
  const [bookings, setBookings] = useState<OwnerBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [upcomingOnly, setUpcomingOnly] = useState(false)

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
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )
  }, [bookings, upcomingOnly])

  const stats = useMemo(
    () => ({
      total: bookings.length,
      pending: bookings.filter(item => item.status === 'PENDING').length,
      confirmed: bookings.filter(item => item.status === 'CONFIRMED').length,
      cancelled: bookings.filter(item => item.status === 'CANCELLED').length,
      revenue: bookings
        .filter(item => item.status === 'CONFIRMED')
        .reduce((sum, item) => sum + bookingTotal(item), 0),
    }),
    [bookings]
  )

  const updateStatus = async (booking: OwnerBooking, action: 'confirm' | 'cancel') => {
    setPendingAction(`${booking.id}-${action}`)
    const previous = bookings
    setBookings(current =>
      current.map(item =>
        item.id === booking.id
          ? { ...item, status: action === 'confirm' ? ('CONFIRMED' as const) : ('CANCELLED' as const) }
          : item
      )
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
          <span
            className={`flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.gradient} text-white`}
          >
            <Icon className="size-7" />
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
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng đơn"
          value={String(stats.total)}
          icon={<CalendarDays className="size-5" />}
          tone="primary"
        />
        <StatCard
          label="Chờ xác nhận"
          value={String(stats.pending)}
          icon={<Clock3 className="size-5" />}
          tone="amber"
        />
        <StatCard
          label="Đã xác nhận"
          value={String(stats.confirmed)}
          icon={<CheckCircle2 className="size-5" />}
          tone="emerald"
        />
        <StatCard
          label="Doanh thu đã xác nhận"
          value={formatVND(stats.revenue)}
          icon={<TrendingUp className="size-5" />}
          tone="primary"
        />
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Đơn đặt sân</h2>
        <Button
          variant={upcomingOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUpcomingOnly(value => !value)}
        >
          {upcomingOnly ? 'Đang lọc: đơn sắp tới' : 'Chỉ hiện đơn sắp tới'}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map(column => {
          const items = visible.filter(item => item.status === column.status)
          const columnMeta = bookingStatusMeta(column.status)
          return (
            <div
              key={column.status}
              className={`flex flex-col gap-3 rounded-2xl border p-4 ${columnMeta.column}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${columnMeta.dot}`} />
                  <p className="font-semibold">{column.title}</p>
                </div>
                <Badge variant="outline" className={columnMeta.className}>
                  {items.length}
                </Badge>
              </div>

              {items.length === 0 ? (
                <p className="rounded-xl border border-dashed bg-background/60 px-3 py-6 text-center text-sm text-muted-foreground">
                  Chưa có đơn nào
                </p>
              ) : (
                items.map(item => (
                  <BookingCard
                    key={item.id}
                    booking={item}
                    pendingAction={pendingAction}
                    onAction={updateStatus}
                  />
                ))
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
function BookingCard({
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
    <Card className="gap-3 shadow-sm">
      <CardContent className="flex flex-col gap-3">
        <div>
          <p className="flex items-center gap-1.5 font-semibold">
            <CalendarDays className="size-4 text-primary" />
            {formatDate(booking.startTime)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatTimeRange(booking.startTime, booking.endTime)} ·{' '}
            {hoursBetween(booking.startTime, booking.endTime)} giờ
          </p>
        </div>

        <div className="flex flex-col gap-1 border-t pt-3 text-sm">
          <p className="font-medium">{booking.user.name}</p>
          {booking.user.phone && (
            <a
              href={`tel:${booking.user.phone}`}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <Phone className="size-3.5" /> {booking.user.phone}
            </a>
          )}
          {booking.user.email && (
            <a
              href={`mailto:${booking.user.email}`}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <Mail className="size-3.5" /> {booking.user.email}
            </a>
          )}
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          <span className="font-semibold text-primary">{formatVND(bookingTotal(booking))}</span>
          <Badge variant="outline" className={statusMeta.className}>
            {statusMeta.label}
          </Badge>
        </div>

        {booking.status !== 'CANCELLED' && (
          <div className="flex gap-2">
            {booking.status === 'PENDING' && (
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onAction(booking, 'confirm')}
                disabled={isConfirming}
              >
                <CheckCircle2 />
                {isConfirming ? 'Đang xử lý...' : 'Xác nhận'}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className={booking.status === 'PENDING' ? '' : 'flex-1'}
              onClick={() => onAction(booking, 'cancel')}
              disabled={isCancelling}
            >
              <Ban />
              {isCancelling ? 'Đang hủy...' : 'Hủy đơn'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: string
  icon: React.ReactNode
  tone: 'primary' | 'amber' | 'emerald'
}) {
  const tones = {
    primary: 'bg-primary/10 text-primary',
    amber: 'bg-amber-100 text-amber-700',
    emerald: 'bg-emerald-100 text-emerald-700',
  }
  const values = {
    primary: 'text-primary',
    amber: 'text-amber-600',
    emerald: 'text-emerald-600',
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`text-2xl font-bold ${values[tone]}`}>{value}</p>
        </div>
        <div className={`rounded-xl p-3 ${tones[tone]}`}>{icon}</div>
      </CardContent>
    </Card>
  )
}