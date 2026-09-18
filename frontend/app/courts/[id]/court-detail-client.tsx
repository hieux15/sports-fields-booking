'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Store,
} from 'lucide-react'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/api-error'
import { courtTypeMeta } from '@/lib/court-type'
import { formatVND, hoursBetween } from '@/lib/format'
import type { CourtDetail } from '@/lib/types'
import { useAuth } from '@/components/auth-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

const DURATIONS = [
  { label: '1 giờ', minutes: 60 },
  { label: '1,5 giờ', minutes: 90 },
  { label: '2 giờ', minutes: 120 },
]

function pad(value: number) {
  return String(value).padStart(2, '0')
}

/** Định dạng ngày theo giờ địa phương cho input type="date". */
function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return hours * 60 + minutes
}

function addMinutes(time: string, minutes: number) {
  const total = (toMinutes(time) ?? 0) + minutes
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`
}

function roundToStep(time: string, step = 15) {
  const minutes = toMinutes(time)
  if (minutes === null) return time
  const rounded = Math.round(minutes / step) * step
  return `${pad(Math.floor(rounded / 60) % 24)}:${pad(rounded % 60)}`
}

function nowTimeRounded() {
  const now = new Date()
  return roundToStep(`${pad(now.getHours())}:${pad(now.getMinutes())}`)
}

export default function CourtDetailClient({ id }: { id: string }) {
  const { user } = useAuth()
  const router = useRouter()
  const [court, setCourt] = useState<CourtDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [date, setDate] = useState('')
  const [start, setStart] = useState('18:00')
  const [end, setEnd] = useState('19:30')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError(null)
    api
      .court(id)
      .then(data => {
        if (!active) return
        setCourt(data)
        setDate(toDateInputValue(new Date()))
      })
      .catch(e => {
        if (active) setLoadError(getErrorMessage(e))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id])

  const meta = courtTypeMeta(court?.type ?? '')
  const Icon = meta.icon
  const total = useMemo(() => {
    if (!court || !date || !start || !end || start >= end) return 0
    const startIso = new Date(`${date}T${start}`).toISOString()
    const endIso = new Date(`${date}T${end}`).toISOString()
    return hoursBetween(startIso, endIso) * Number(court.pricePerHour)
  }, [court, date, start, end])

  const duration = useMemo(() => {
    if (start >= end) return 0
    return hoursBetween(
      new Date(`2000-01-01T${start}`).toISOString(),
      new Date(`2000-01-01T${end}`).toISOString()
    )
  }, [start, end])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!court) return
    setFormError(null)
    if (!date) {
      setFormError('Vui lòng chọn ngày chơi')
      return
    }
    if (start >= end) {
      setFormError('Thời gian bắt đầu phải trước thời gian kết thúc')
      return
    }
    const openMinutes = toMinutes(court.openTime)
    const closeMinutes = toMinutes(court.closeTime)
    const startMinutes = toMinutes(start)
    const endMinutes = toMinutes(end)
    if (openMinutes === null || closeMinutes === null) {
      setFormError('Giờ mở cửa của sân không hợp lệ, vui lòng liên hệ chủ sân')
      return
    }
    if (
      startMinutes === null ||
      endMinutes === null ||
      startMinutes < openMinutes ||
      endMinutes > closeMinutes
    ) {
      setFormError(`Sân hoạt động từ ${court.openTime} đến ${court.closeTime}`)
      return
    }
    const startIso = new Date(`${date}T${start}`).toISOString()
    if (new Date(startIso).getTime() <= Date.now()) {
      setFormError('Thời gian bắt đầu phải sau thời gian hiện tại')
      return
    }
    setSubmitting(true)
    try {
      await api.createBooking({
        courtId: id,
        startTime: startIso,
        endTime: new Date(`${date}T${end}`).toISOString(),
      })
      toast.success('Đặt sân thành công, vui lòng chờ chủ sân xác nhận')
      router.push('/bookings')
    } catch (e) {
      setFormError(getErrorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          <div className="flex flex-col gap-6">
            <Skeleton className="h-52 rounded-2xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    )
  }

  if (loadError || !court) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <Store className="mx-auto size-12 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-bold">Không tìm thấy sân thể thao</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {loadError ?? 'Sân này có thể đã bị xóa hoặc không tồn tại.'}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="outline" nativeButton={false} render={<Link href="/courts" />}>
            <ArrowLeft /> Về danh sách sân
          </Button>
          <Button onClick={() => router.refresh()}>
            <RefreshCw /> Thử lại
          </Button>
        </div>
      </div>
    )
  }
return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link
        href="/courts"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Quay lại danh sách
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="flex flex-col gap-6">
          <div
            className="relative overflow-hidden rounded-2xl bg-cover bg-center p-8 text-white"
            style={{ backgroundImage: `url(${meta.image})` }}
          >
            <div className={`absolute inset-0 ${meta.overlay}`} />
            <Icon className="absolute -bottom-4 right-2 size-32 opacity-20" />
            <div className="relative">
              <Badge className="border-0 bg-white/15 text-white">{meta.label}</Badge>
              <h1 className="mt-6 text-4xl font-bold">{court.name}</h1>
              <div className="mt-4 flex items-center gap-2 text-white/90">
                <MapPin className="size-4" /> {court.address || 'Chưa cập nhật địa chỉ'}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="shadow-sm">
              <CardContent className="flex flex-col gap-1">
                <p className="text-xs text-muted-foreground">Giá thuê</p>
                <p className="text-lg font-bold text-primary">
                  {formatVND(Number(court.pricePerHour))}
                  <span className="text-sm font-normal text-muted-foreground">/giờ</span>
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="flex flex-col gap-1">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock3 className="size-3.5" /> Khung giờ hoạt động
                </p>
                <p className="text-lg font-semibold">
                  {court.openTime} – {court.closeTime}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="flex flex-col gap-1">
                <p className="text-xs text-muted-foreground">Loại sân</p>
                <p className="text-lg font-semibold">{meta.label}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" /> Thông tin chủ sân
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Store className="size-5" />
                </div>
                <div>
                  <p className="font-semibold">{court.owner.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {court.owner.phone || 'Chưa cập nhật số điện thoại'}
                  </p>
                </div>
              </div>
              {court.owner.phone && (
                <Button variant="outline" nativeButton={false} render={<a href={`tel:${court.owner.phone}`} />}>
                  <Phone /> Liên hệ
                </Button>
              )}
            </CardContent>

          </Card>
        </div>

        <div>
          <Card className="shadow-sm lg:sticky lg:top-24">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="size-4 text-primary" /> Đặt sân
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              {!user ? (
                <div className="flex flex-col gap-3 text-center">
                  <p className="text-sm text-muted-foreground">
                    Đăng nhập để đặt sân và theo dõi lịch chơi của bạn.
                  </p>
                  <Button nativeButton={false} render={<Link href="/login" />}>
                    Đăng nhập để đặt sân
                  </Button>
                  <Button variant="outline" nativeButton={false} render={<Link href="/register" />}>
                    Tạo tài khoản mới
                  </Button>
                </div>
              ) : (
                <form onSubmit={submit} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="booking-date">Ngày chơi</Label>
                    <Input
                      id="booking-date"
                      className="h-11"
                      type="date"
                      min={toDateInputValue(new Date())}
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="booking-start">Bắt đầu</Label>
                      <Input
                        id="booking-start"
                        className="h-11"
                        type="time"
                        min={court.openTime}
                        max={court.closeTime}
                        step={900}
                        value={start}
                        onChange={e => setStart(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="booking-end">Kết thúc</Label>
                      <Input
                        id="booking-end"
                        className="h-11"
                        type="time"
                        min={court.openTime}
                        max={court.closeTime}
                        step={900}
                        value={end}
                        onChange={e => setEnd(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {DURATIONS.map(item => (
                      <Button
                        key={item.minutes}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEnd(addMinutes(start, item.minutes))}
                      >
                        {item.label}
                      </Button>
                    ))}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const next = nowTimeRounded()
                        setStart(next)
                        setEnd(addMinutes(next, 90))
                      }}
                    >
                      <Sparkles /> Giờ hiện tại
                    </Button>
                  </div>

                  <div className="flex flex-col gap-2 rounded-xl bg-muted/60 p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Thời lượng</span>
                      <span className="font-medium">{duration > 0 ? `${duration} giờ` : '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Đơn giá</span>
                      <span className="font-medium">{formatVND(Number(court.pricePerHour))}/giờ</span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2 text-base">
                      <span className="font-medium">Tạm tính</span>
                      <span className="font-bold text-primary">{formatVND(total)}</span>
                    </div>
                  </div>

                  {formError && (
                    <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {formError}
                    </p>
                  )}

                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Đang đặt sân...' : 'Xác nhận đặt sân'}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Đơn của bạn ở trạng thái <strong>Chờ xác nhận</strong> cho đến khi chủ sân xác
                    nhận. Bạn có thể hủy đơn trước giờ bắt đầu trong mục Đơn đặt sân.
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
