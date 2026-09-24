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
 * Quy đổi giá trị `type` trong database về nhóm chuẩn. Dữ liệu thật lưu chữ
 * thường ('bóng đá') còn form gửi chữ hoa ('Bóng đá'), nên phải bỏ dấu và hạ
 * chữ thường trước khi so sánh.
 */
export function normalizeType(type: string): CourtTypeKey {
  const value = (type || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')

  switch (value) {
    case 'bong da':
    case 'bong da mini':
    case 'san bong':
      return 'FOOTBALL'
    case 'cau long':
      return 'BADMINTON'
    case 'tennis':
      return 'TENNIS'
    case 'pickleball':
      return 'PICKLEBALL'
    case 'bong ro':
      return 'BASKETBALL'
    default:
      return 'OTHER'
  }
}

export function courtTypeMeta(type: string): CourtTypeMeta {
  const key = normalizeType(type)
  return { key, ...META[key] }
}

export function courtTypeLabel(type: string): string {
  return courtTypeMeta(type).label
}

/** Sân tối thiểu để chọn ảnh — đủ cho cả `Court` lẫn `CourtDetail`. */
export type CourtImageSource = { type: string; imageUrl?: string | null }

/**
 * Ảnh hiển thị của sân: ưu tiên ảnh thật chủ sân tải lên (`Court.imageUrl`), chỉ
 * khi chưa có mới rơi về ảnh minh hoạ theo loại sân. Nhờ vậy mọi sân bóng đá
 * không còn dùng chung một tấm ảnh.
 */
export function courtImageSource(court: CourtImageSource): string {
  const uploaded = court.imageUrl?.trim()
  return uploaded ? uploaded : courtTypeMeta(court.type).image
}
