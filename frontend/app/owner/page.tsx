'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Hourglass,
  Phone,
  Plus,
  RefreshCw,
  Store,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/api-error'
import { bookingTotal, isActiveBooking, isConfirmedBooking, statusCount } from '@/lib/booking-utils'
import { formatDate, formatTimeRange, formatVND } from '@/lib/format'
import type { Court, OwnerBooking } from '@/lib/types'
import { useAuth } from '@/components/auth-provider'
import { OwnerCourtCard } from '@/components/owner-court-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

export default function OwnerPage() {
  const { user, loading: authLoading } = useAuth()
  const [courts, setCourts] = useState<Court[]>([])
  const [bookings, setBookings] = useState<OwnerBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!user || user.role !== 'OWNER') return
    setLoading(true)
    setError(null)
    api
      .myCourts()
      .then(async list => {
        setCourts(list)
        const groups = await Promise.all(
          list.map(court =>
            api
              .courtBookings(court.id)
              .then(items => items)
              .catch(() => [] as OwnerBooking[])
          )
        )
        setBookings(groups.flat())
      })
      .catch(e => setError(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    if (!authLoading) load()
  }, [authLoading, load])

  const stats = useMemo(() => {
    const active = bookings.filter(isActiveBooking)
    return {
      courts: courts.length,
      active: active.length,
      pending: statusCount(bookings, 'PENDING'),
      confirmed: statusCount(bookings, 'CONFIRMED'),
      revenue: bookings
        .filter(isConfirmedBooking)
        .reduce((sum, item) => sum + bookingTotal(item), 0),
    }
  }, [bookings, courts])

  const pendingBookings = useMemo(
    () =>
      bookings
        .filter(item => item.status === 'PENDING')
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [bookings]
  )

  const pendingByCourt = useMemo(() => {
    const map = new Map<string, number>()
    pendingBookings.forEach(item => map.set(item.courtId, (map.get(item.courtId) ?? 0) + 1))
    return map
  }, [pendingBookings])

  const confirm = async (booking: OwnerBooking) => {
    setConfirmingId(booking.id)
    const previous = bookings
    setBookings(current =>
      current.map(item =>
        item.id === booking.id ? { ...item, status: 'CONFIRMED' as const } : item
      )
    )
    try {
      await api.confirmBooking(booking.id)
      toast.success('Đã xác nhận đơn đặt sân')
    } catch (e) {
      setBookings(previous)
      toast.error(getErrorMessage(e))
    } finally {
      setConfirmingId(null)
    }
  }

  if (!authLoading && (!user || user.role !== 'OWNER')) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <Store className="mx-auto size-12 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-bold">Khu vực dành cho chủ sân</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Đăng nhập bằng tài khoản chủ sân để quản lý sân và đơn đặt sân của bạn.
        </p>
        <Button className="mt-6" nativeButton={false} render={<Link href="/login" />}>
          Đăng nhập
        </Button>
      </div>
    )
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Khu vực chủ sân
          </p>
          <h1 className="mt-1 text-3xl font-bold">Tổng quan sân của bạn</h1>
          <p className="mt-2 text-muted-foreground">
            Xử lý đơn mới trước, sau đó cập nhật thông tin và khung giờ hoạt động của từng sân.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw /> Làm mới
          </Button>
          <Button nativeButton={false} render={<Link href="/owner/courts/new" />}>
            <Plus /> Thêm sân
          </Button>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <Store className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sân đang quản lý</p>
              <p className="text-2xl font-bold">{stats.courts}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
              <Hourglass className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Đơn chờ xác nhận</p>
              <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3">
            <div className="rounded-xl bg-sky-100 p-3 text-sky-700">
              <TrendingUp className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Đơn chưa hủy</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
              <Wallet className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Doanh thu đã xác nhận</p>
              <p className="text-2xl font-bold text-primary">{formatVND(stats.revenue)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="mb-8 shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="font-semibold">Không tải được dữ liệu</p>
            <p className="max-w-md text-sm text-muted-foreground">{error}</p>
            <Button onClick={load} className="mt-2">
              <RefreshCw /> Thử lại
            </Button>
          </CardContent>
        </Card>
      )}

      {!error && (
        <>
          <Card className="mb-8 shadow-sm">
            <CardHeader className="border-b">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <Clock3 className="size-4 text-amber-600" /> Đơn chờ bạn xác nhận
                  {pendingBookings.length > 0 && (
                    <Badge variant="destructive">{pendingBookings.length}</Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Xác nhận sớm để khách yên tâm giữ lịch.
                </p>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              {loading ? (
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-16 rounded-lg" />
                  <Skeleton className="h-16 rounded-lg" />
                </div>
              ) : pendingBookings.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <CheckCircle2 className="size-9 text-emerald-500" />
                  <p className="font-medium">Không có đơn nào đang chờ</p>
                  <p className="text-sm text-muted-foreground">
                    Mọi đơn đặt sân của bạn đã được xử lý.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col divide-y">
                  {pendingBookings.map(item => (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-amber-100 p-2.5 text-amber-700">
                          <CalendarDays className="size-5" />
                        </div>
                        <div>
                          <p className="font-semibold">{item.court.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatTimeRange(item.startTime, item.endTime)} ·{' '}
                            {formatDate(item.startTime)}
                          </p>
                          <p className="mt-1 flex flex-wrap items-center gap-3 text-sm">
                            <span className="font-medium">{item.user.name}</span>
                            {item.user.phone && (
                              <a
                                href={`tel:${item.user.phone}`}
                                className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                              >
                                <Phone className="size-3.5" />
                                {item.user.phone}
                              </a>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-primary">
                          {formatVND(bookingTotal(item))}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => confirm(item)}
                          disabled={confirmingId === item.id}
                        >
                          <CheckCircle2 />
                          {confirmingId === item.id ? 'Đang xác nhận...' : 'Xác nhận'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-bold">Sân của bạn</h2>
            <p className="text-sm text-muted-foreground">{stats.courts} sân đang quản lý</p>
          </div>

          {loading ? (
            <div className="grid gap-5 lg:grid-cols-2">
              <Skeleton className="h-52 rounded-xl" />
              <Skeleton className="h-52 rounded-xl" />
            </div>
          ) : courts.length === 0 ? (
            <Card className="border-dashed shadow-none">
              <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
                <Store className="size-10 text-muted-foreground" />
                <p className="text-lg font-semibold">Bạn chưa có sân nào</p>
                <p className="text-sm text-muted-foreground">
                  Tạo sân đầu tiên để bắt đầu nhận đơn đặt sân từ khách.
                </p>
                <Button
                  className="mt-3"
                  nativeButton={false}
                  render={<Link href="/owner/courts/new" />}
                >
                  <Plus /> Thêm sân đầu tiên
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {courts.map(court => (
                <OwnerCourtCard
                  key={court.id}
                  court={court}
                  pendingCount={pendingByCourt.get(court.id) ?? 0}
                  onDeleted={id => setCourts(current => current.filter(item => item.id !== id))}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
