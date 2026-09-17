'use client'

import { useState } from 'react'
import { Clock3, MapPin, Pencil, Plus, Store } from 'lucide-react'
import { COURT_TYPE_OPTIONS, courtTypeLabel } from '@/lib/court-type'
import { getErrorMessage } from '@/lib/api-error'
import type { Court, CourtInput } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const DEFAULT_VALUES: CourtInput = {
  name: '',
  type: COURT_TYPE_OPTIONS[0].label,
  address: '',
  pricePerHour: 100000,
  openTime: '06:00',
  closeTime: '22:00',
}

function toFormValues(court: Court): CourtInput {
  return {
    name: court.name,
    type: courtTypeLabel(court.type),
    address: court.address ?? '',
    pricePerHour: Number(court.pricePerHour),
    openTime: court.openTime,
    closeTime: court.closeTime,
  }
}

export function CourtForm({
  court,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  court?: Court
  onSubmit: (values: CourtInput) => Promise<void>
  onCancel?: () => void
  submitLabel?: string
}) {
  const [values, setValues] = useState<CourtInput>(() =>
    court ? toFormValues(court) : DEFAULT_VALUES
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEdit = Boolean(court)

  const update = <K extends keyof CourtInput>(key: K, value: CourtInput[K]) => {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!values.name.trim()) {
      setError('Vui lòng nhập tên sân')
      return
    }
    if (!values.type) {
      setError('Vui lòng chọn loại sân')
      return
    }
    if (!Number.isFinite(values.pricePerHour) || values.pricePerHour < 0) {
      setError('Giá thuê mỗi giờ không hợp lệ')
      return
    }
    if (!values.openTime || !values.closeTime || values.openTime >= values.closeTime) {
      setError('Giờ mở cửa phải trước giờ đóng cửa')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        ...values,
        name: values.name.trim(),
        address: values.address?.trim() || undefined,
      })
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            {isEdit ? (
              <Pencil className="size-4 text-primary" />
            ) : (
              <Plus className="size-4 text-primary" />
            )}
            {isEdit ? 'Thông tin sân' : 'Sân mới'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 pt-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="court-name" className="flex items-center gap-1.5">
              <Store className="size-4" /> Tên sân
            </Label>
            <Input
              id="court-name"
              className="h-11"
              placeholder="VD: Green Field 01"
              value={values.name}
              onChange={e => update('name', e.target.value)}
              required
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="court-type">Loại sân</Label>
              <Select
                items={COURT_TYPE_OPTIONS.map(option => ({
                  value: option.label,
                  label: option.label,
                }))}
                value={values.type}
                onValueChange={value => update('type', value ?? '')}
              >
                <SelectTrigger id="court-type" className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COURT_TYPE_OPTIONS.map(option => (
                    <SelectItem key={option.key} value={option.label}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="court-price">Giá thuê mỗi giờ (₫)</Label>
              <Input
                id="court-price"
                className="h-11"
                type="number"
                min={0}
                step={10000}
                value={values.pricePerHour}
                onChange={e => update('pricePerHour', Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="court-address" className="flex items-center gap-1.5">
              <MapPin className="size-4" /> Địa chỉ
            </Label>
            <Input
              id="court-address"
              className="h-11"
              placeholder="Số nhà, đường, quận, thành phố"
              value={values.address ?? ''}
              onChange={e => update('address', e.target.value)}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="court-open" className="flex items-center gap-1.5">
                <Clock3 className="size-4" /> Giờ mở cửa
              </Label>
              <Input
                id="court-open"
                className="h-11"
                type="time"
                value={values.openTime}
                onChange={e => update('openTime', e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="court-close" className="flex items-center gap-1.5">
                <Clock3 className="size-4" /> Giờ đóng cửa
              </Label>
              <Input
                id="court-close"
                className="h-11"
                type="time"
                value={values.closeTime}
                onChange={e => update('closeTime', e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
                Hủy
              </Button>
            )}
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Đang lưu...' : (submitLabel ?? (isEdit ? 'Lưu thay đổi' : 'Tạo sân'))}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
