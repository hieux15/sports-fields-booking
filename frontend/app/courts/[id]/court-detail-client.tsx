'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  MapPin,
  Phone,
  RefreshCw,
  Store,
} from 'lucide-react'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/api-error'
import { courtTypeMeta } from '@/lib/court-type'
import { formatVND, hoursBetween } from '@/lib/format'
import type { CourtDetail } from '@/lib/types'
import { useAuth } from '@/components/auth-provider'
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

  /** Bỏ qua kết quả của request cũ khi đổi sân hoặc React chạy lại effect. */
  const requestVersion = useRef(0)

  /**
   * Tách thành `load` để nút "Thử lại" gọi lại được đúng request —
   * `router.refresh()` không chạy lại effect của client component.
   */
  const load = useCallback(() => {
    const version = ++requestVersion.current
    setLoading(true)
    setLoadError(null)
    api
      .court(id)
      .then(data => {
        if (version !== requestVersion.current) return
        setCourt(data)
        setDate(toDateInputValue(new Date()))
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

  const meta = courtTypeMeta(court?.type ?? '')
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
      <div>
        <Skeleton className="h-[min(48vh,420px)] w-full rounded-none" />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <div className="flex flex-col gap-4">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-20 w-full" />
            </div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    )
  }

  if (loadError || !court) {
    return (
      <div role="alert" className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <Store className="mx-auto size-12 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-bold">Không tìm thấy sân thể thao</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {loadError ?? 'Sân này có thể đã bị xóa hoặc không tồn tại.'}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="outline" nativeButton={false} render={<Link href="/courts" />}>
            <ArrowLeft /> Về danh sách sân
          </Button>
          <Button onClick={load}>
            <RefreshCw /> Thử lại
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Full-bleed photo hero */}
      <section className="relative min-h-[min(48vh,420px)] overflow-hidden text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={meta.image}
          alt=""
          fetchPriority="high"
          decoding="async"
          className="hero-photo absolute inset-0 size-full object-cover"
        />
        <div className={`absolute inset-0 ${meta.overlay}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25" />

        <div className="relative mx-auto flex min-h-[min(48vh,420px)] max-w-7xl flex-col justify-end px-4 pb-8 pt-16 sm:px-6 sm:pb-10">
          <Link
            href="/courts"
            className="mb-auto inline-flex w-fit items-center gap-2 text-sm text-white/80 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-4" /> Quay lại danh sách
          </Link>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white/75">
            {meta.label}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {court.name}
          </h1>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
          <div className="flex flex-col gap-8">
            {/* Inline meta: price · hours · type */}
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground sm:text-base">
              <span className="font-bold text-accent-foreground">
                {formatVND(Number(court.pricePerHour))}
                <span className="font-normal text-muted-foreground">/giờ</span>
              </span>
              <span aria-hidden className="text-border">
                ·
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="size-3.5 shrink-0" />
                {court.openTime} – {court.closeTime}
              </span>
              <span aria-hidden className="text-border">
                ·
              </span>
              <span>{meta.label}</span>
            </p>

            <div className="flex items-start gap-2 text-sm text-muted-foreground sm:text-base">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{court.address || 'Chưa cập nhật địa chỉ'}</span>
            </div>

            {/* Owner info — plain divider block, not a marketing card */}
            <div className="border-t border-border pt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Chủ sân
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-foreground">{court.owner.name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {court.owner.phone || 'Chưa cập nhật số điện thoại'}
                  </p>
                </div>
                {court.owner.phone && (
                  <Button
                    variant="outline"
                    size="sm"
                    nativeButton={false}
                    render={<a href={`tel:${court.owner.phone}`} />}
                  >
                    <Phone /> Liên hệ
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Booking form — only interactive card surface */}
          <Card className="border-border shadow-none ring-1 ring-foreground/5 lg:sticky lg:top-20">
            <CardHeader className="border-b border-border/80">
              <CardTitle className="flex items-center gap-2 text-base">
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
                      aria-invalid={Boolean(formError)}
                      aria-describedby={formError ? 'booking-form-error' : undefined}
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
                        aria-invalid={Boolean(formError)}
                        aria-describedby={formError ? 'booking-form-error' : undefined}
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
                        aria-invalid={Boolean(formError)}
                        aria-describedby={formError ? 'booking-form-error' : undefined}
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
                      <Clock3 /> Giờ hiện tại
                    </Button>
                  </div>

                  <div className="flex flex-col gap-2 border border-border/80 bg-muted/40 p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Thời lượng</span>
                      <span className="font-medium">{duration > 0 ? `${duration} giờ` : '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Đơn giá</span>
                      <span className="font-medium">
                        {formatVND(Number(court.pricePerHour))}/giờ
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-2 text-base">
                      <span className="font-medium">Tạm tính</span>
                      <span className="font-bold text-accent-foreground">{formatVND(total)}</span>
                    </div>
                  </div>

                  {formError && (
                    <p
                      id="booking-form-error"
                      role="alert"
                      className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                    >
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
