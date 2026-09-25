import { CircleDot, Goal, ShieldAlert, Target, Trophy, Volleyball } from 'lucide-react'
import type { ComponentType } from 'react'

export type CourtTypeKey =
  | 'FOOTBALL'
  | 'BADMINTON'
  | 'TENNIS'
  | 'PICKLEBALL'
  | 'BASKETBALL'
  | 'OTHER'

export type CourtTypeMeta = {
  key: CourtTypeKey
  label: string
  icon: ComponentType<{ className?: string }>
  /** Ảnh minh hoạ theo loại sân, chỉ dùng khi sân chưa có ảnh thật (`Court.imageUrl`). */
  image: string
  /** Muted overlay class for text legibility over the photo. */
  overlay: string
}

export const COURT_FALLBACK_IMAGE = '/court-fallback.svg'

const META: Record<CourtTypeKey, Omit<CourtTypeMeta, 'key'>> = {
  FOOTBALL: {
    label: 'Bóng đá',
    icon: Goal,
    image:
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1400&q=80',
    overlay: 'bg-black/45',
  },
  BADMINTON: {
    label: 'Cầu lông',
    icon: Volleyball,
    image:
      'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1400&q=80',
    overlay: 'bg-black/45',
  },
  TENNIS: {
    label: 'Tennis',
    icon: CircleDot,
    image:
      'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1400&q=80',
    overlay: 'bg-black/45',
  },
  PICKLEBALL: {
    label: 'Pickleball',
    icon: Target,
    image:
      'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1400&q=80',
    overlay: 'bg-black/45',
  },
  BASKETBALL: {
    label: 'Bóng rổ',
    icon: Trophy,
    image:
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1400&q=80',
    overlay: 'bg-black/45',
  },
  OTHER: {
    label: 'Khác',
    icon: ShieldAlert,
    image:
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1400&q=80',
    overlay: 'bg-black/50',
  },
}

/** Danh sách loại sân dùng cho bộ lọc và form thêm/sửa sân. */
export const COURT_TYPE_OPTIONS: { key: CourtTypeKey; label: string }[] = [
  { key: 'FOOTBALL', label: META.FOOTBALL.label },
  { key: 'BADMINTON', label: META.BADMINTON.label },
  { key: 'TENNIS', label: META.TENNIS.label },
  { key: 'PICKLEBALL', label: META.PICKLEBALL.label },
  { key: 'BASKETBALL', label: META.BASKETBALL.label },
  { key: 'OTHER', label: META.OTHER.label },
]

/**
 * Trả metadata theo key enum — `Court.type` là `SportType` trong database nên
 * không còn phải normalise/bỏ dấu để so sánh như khi còn là text tự do.
 */
export function courtTypeMeta(type: CourtTypeKey): CourtTypeMeta {
  return { key: type, ...META[type] }
}

/** Sân tối thiểu để chọn ảnh — đủ cho cả `Court` lẫn `CourtDetail`. */
export type CourtImageSource = { type: CourtTypeKey; imageUrl?: string | null }

/**
 * Ảnh hiển thị của sân: ưu tiên ảnh thật chủ sân tải lên (`Court.imageUrl`), chỉ
 * khi chưa có mới rơi về ảnh minh hoạ theo loại sân. Nhờ vậy mọi sân bóng đá
 * không còn dùng chung một tấm ảnh.
 */
export function courtImageSource(court: CourtImageSource): string {
  const uploaded = court.imageUrl?.trim()
  return uploaded ? uploaded : courtTypeMeta(court.type).image
}
