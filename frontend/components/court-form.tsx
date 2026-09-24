'use client'

import { useState } from 'react'
import { Clock3, ImagePlus, MapPin, Pencil, Plus, Store, Trash2 } from 'lucide-react'
import { COURT_TYPE_OPTIONS, courtTypeLabel } from '@/lib/court-type'
import { COURT_IMAGE_ACCEPT, validateCourtImageFile } from '@/lib/court-image'
import { getErrorMessage } from '@/lib/api-error'
import { api } from '@/lib/api'
import { CourtImage } from '@/components/court-image'
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

const MIN_COURT_PRICE = 10000
const MAX_COURT_PRICE = 10000000

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
    imageUrl: court.imageUrl,
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
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isEdit = Boolean(court)

  const update = <K extends keyof CourtInput>(key: K, value: CourtInput[K]) => {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  /**
   * Upload ngay khi chọn file để form chỉ còn giữ `imageUrl` — nhờ vậy `onSubmit`
   * không đổi, dùng chung cho cả tạo sân, sửa sân và luồng become-owner.
   */
  const pickImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    const file = input.files?.[0]
    // Cho phép chọn lại đúng file vừa xoá (input không đổi giá trị thì không bắn change).
    input.value = ''
    if (!file) return

    const invalid = validateCourtImageFile(file)
    if (invalid) {
      setImageError(invalid)
      return
    }

    setImageError(null)
    setUploadingImage(true)
    try {
      const { imageUrl } = await api.uploadCourtImage(file)
      update('imageUrl', imageUrl)
    } catch (e) {
      setImageError(getErrorMessage(e))
    } finally {
      setUploadingImage(false)
    }
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (uploadingImage) {
      setError('Vui lòng đợi ảnh tải lên xong trước khi lưu')
      return
    }
    if (!values.name.trim()) {
      setError('Vui lòng nhập tên sân')
      return
    }
    if (!values.type) {
      setError('Vui lòng chọn loại sân')
      return
    }
    if (
      !Number.isFinite(values.pricePerHour) ||
      values.pricePerHour < MIN_COURT_PRICE ||
      values.pricePerHour > MAX_COURT_PRICE
    ) {
      setError('Giá thuê mỗi giờ phải từ 10.000 đến 10.000.000 ₫')
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
                min={MIN_COURT_PRICE}
                max={MAX_COURT_PRICE}
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="court-image" className="flex items-center gap-1.5">
              <ImagePlus className="size-4" /> Ảnh sân
            </Label>
            <div className="flex flex-wrap items-start gap-4">
              <div className="relative aspect-[16/10] w-full max-w-64 overflow-hidden border border-border bg-muted">
                <CourtImage
                  court={{ type: values.type, imageUrl: values.imageUrl }}
                  alt="Ảnh sân"
                  sizes="256px"
                  className="absolute inset-0 size-full object-cover"
                />
                {uploadingImage && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-xs font-medium text-white">
                    Đang tải ảnh...
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Input
                  id="court-image"
                  className="h-11 cursor-pointer"
                  type="file"
                  accept={COURT_IMAGE_ACCEPT}
                  onChange={pickImage}
                  disabled={uploadingImage}
                />
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, WEBP, AVIF hoặc GIF, tối đa 5MB. Không chọn thì sân dùng
                  ảnh minh hoạ theo loại sân.
                </p>
                {values.imageUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    disabled={uploadingImage}
                    onClick={() => update('imageUrl', null)}
                  >
                    <Trash2 /> Xoá ảnh
                  </Button>
                )}
              </div>
            </div>
            {imageError && (
              <p role="alert" className="text-sm text-destructive">
                {imageError}
              </p>
            )}
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
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={submitting || uploadingImage}
              >
                Hủy
              </Button>
            )}
            <Button type="submit" disabled={submitting || uploadingImage}>
              {submitting
                ? 'Đang lưu...'
                : uploadingImage
                  ? 'Đang tải ảnh...'
                  : (submitLabel ?? (isEdit ? 'Lưu thay đổi' : 'Tạo sân'))}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
