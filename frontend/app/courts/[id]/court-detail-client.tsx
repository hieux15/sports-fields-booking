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
import { CourtImage } from '@/components/court-image'
import {
  formatVND,
  hoursBetween,
  vietnamDateInputValue,
  vietnamLocalIso,
} from '@/lib/format'
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
  { label: '3 giờ', minutes: 180 },
  { label: '4 giờ', minutes: 240 },
]

export default function CourtDetailClient({ id }: { id: string }) {
  const { user } = useAuth()
  const router = useRouter()
  const [court, setCourt] = useState<CourtDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [date, setDate] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(90)
  const [selectedStart, setSelectedStart] = useState('')
  const [availableSlots, setAvailableSlots] = useState<{ start: string; end: string }[]>([])
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  /** Bỏ qua kết quả của request cũ khi đổi sân hoặc React chạy lại effect. */
  const requestVersion = useRef(0)
  const availabilityVersion = useRef(0)

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
        setDate(vietnamDateInputValue())
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

  useEffect(() => {
    if (!court || !date) return
    const version = ++availabilityVersion.current
    setAvailabilityLoading(true)
    setAvailabilityError(null)
    setSelectedStart('')
    api.courtAvailability(id, date, durationMinutes)
      .then(result => {
        if (version === availabilityVersion.current) setAvailableSlots(result.slots)
      })
      .catch(error => {
        if (version === availabilityVersion.current) {
          setAvailableSlots([])
          setAvailabilityError(getErrorMessage(error))
        }
      })
      .finally(() => {
        if (version === availabilityVersion.current) setAvailabilityLoading(false)
      })
    return () => { availabilityVersion.current += 1 }
  }, [court, date, durationMinutes, id])

  const selectedSlot = availableSlots.find(slot => slot.start === selectedStart)
  const start = selectedSlot?.start ?? ''
  const end = selectedSlot?.end ?? ''

  const meta = courtTypeMeta(court?.type ?? 'OTHER')
  const total = useMemo(() => {
    if (!court || !selectedSlot) return 0
    const startIso = vietnamLocalIso(date, start)
    const endIso = vietnamLocalIso(date, end)
    return hoursBetween(startIso, endIso) * Number(court.pricePerHour)
  }, [court, date, start, end, selectedSlot])

  const duration = useMemo(() => {
    return durationMinutes / 60
  }, [durationMinutes])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!court) return
    setFormError(null)
    if (!date) {
      setFormError('Vui lòng chọn ngày chơi')
      return
    }
    if (!selectedSlot) {
      setFormError('Vui lòng chọn một khung giờ còn trống')
      return
    }
    const startIso = vietnamLocalIso(date, start)
    if (new Date(startIso).getTime() <= Date.now()) {
      setFormError('Thời gian bắt đầu phải sau thời gian hiện tại')
      return
    }
    setSubmitting(true)
    try {
      await api.createBooking({
        courtId: id,
        startTime: startIso,
      endTime: vietnamLocalIso(date, selectedSlot.end),
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
      <section className="relative min-h-[min(48vh,420px)] overflow-hidden bg-muted text-white">
        <CourtImage
          court={court}
          priority
          sizes="100vw"
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
                        min={vietnamDateInputValue()}
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      required
                      aria-invalid={Boolean(formError)}
                      aria-describedby={formError ? 'booking-form-error' : undefined}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Thời lượng</Label>
                    <div className="flex flex-wrap gap-2">
                    {DURATIONS.map(item => (
                      <Button
                        key={item.minutes}
                        type="button"
                        variant={durationMinutes === item.minutes ? 'default' : 'outline'}
                        size="sm"
                        aria-pressed={durationMinutes === item.minutes}
                        onClick={() => setDurationMinutes(item.minutes)}
                      >
                        {item.label}
                      </Button>
                    ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Khung giờ còn trống</Label>
                    {availabilityLoading ? (
                      <p className="text-sm text-muted-foreground">Đang tải khung giờ...</p>
                    ) : availabilityError ? (
                      <p role="alert" className="text-sm text-destructive">{availabilityError}</p>
                    ) : availableSlots.length ? (
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {availableSlots.map(slot => (
                          <Button
                            key={slot.start}
                            type="button"
                            size="sm"
                            variant={selectedStart === slot.start ? 'default' : 'outline'}
                            aria-pressed={selectedStart === slot.start}
                            onClick={() => { setSelectedStart(slot.start); setFormError(null) }}
                          >
                            {slot.start}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Ngày này không còn khung giờ phù hợp.</p>
                    )}
                    {selectedSlot && (
                      <p className="text-xs text-muted-foreground">{selectedSlot.start} – {selectedSlot.end}</p>
                    )}
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

                  <Button type="submit" disabled={submitting || availabilityLoading || !selectedSlot}>
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
