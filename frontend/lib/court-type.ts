import { CircleDot, Goal, ShieldAlert, Sparkles, Trophy, Volleyball } from 'lucide-react'
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
  gradient: string
}

const META: Record<CourtTypeKey, Omit<CourtTypeMeta, 'key'>> = {
  FOOTBALL: { label: 'Bóng đá', icon: Goal, gradient: 'from-emerald-700 to-teal-400' },
  BADMINTON: { label: 'Cầu lông', icon: Volleyball, gradient: 'from-sky-700 to-cyan-400' },
  TENNIS: { label: 'Tennis', icon: CircleDot, gradient: 'from-lime-600 to-emerald-400' },
  PICKLEBALL: { label: 'Pickleball', icon: Sparkles, gradient: 'from-amber-600 to-yellow-400' },
  BASKETBALL: { label: 'Bóng rổ', icon: Trophy, gradient: 'from-orange-700 to-amber-400' },
  OTHER: { label: 'Khác', icon: ShieldAlert, gradient: 'from-slate-800 to-slate-500' },
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
