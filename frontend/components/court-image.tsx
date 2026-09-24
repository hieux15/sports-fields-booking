'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { canOptimizeCourtImage } from '@/lib/court-image'
import {
  COURT_FALLBACK_IMAGE,
  courtImageSource,
  courtTypeMeta,
  type CourtImageSource,
} from '@/lib/court-type'

export function CourtImage({
  court,
  alt = '',
  className,
  sizes = '100vw',
  priority = false,
}: {
  court: CourtImageSource
  alt?: string
  className?: string
  /** Kích thước hiển thị thật, để Next chọn đúng biến thể ảnh. */
  sizes?: string
  /** Ảnh LCP (hero trang chi tiết) thì tải ngay thay vì lazy. */
  priority?: boolean
}) {
  const imageUrl = court.imageUrl
  const type = court.type

  const candidates = useMemo(() => {
    const first = courtImageSource({ type, imageUrl })
    const typeImage = courtTypeMeta(type).image
    return first === typeImage
      ? [first, COURT_FALLBACK_IMAGE]
      : [first, typeImage, COURT_FALLBACK_IMAGE]
  }, [imageUrl, type])

  const [stage, setStage] = useState(0)

  // Sân đổi (điều hướng phía client) thì chạy lại chuỗi dự phòng từ đầu.
  useEffect(() => {
    setStage(0)
  }, [candidates])

  const src = candidates[Math.min(stage, candidates.length - 1)]

  // SVG nội bộ vẽ bằng <img> thường: trình tối ưu của Next cần
  // `dangerouslyAllowSVG` mới chịu xử lý SVG, không đáng mở vì một ảnh dự phòng.
  if (src.endsWith('.svg')) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} decoding="async" />
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={!canOptimizeCourtImage(src)}
      onError={() => setStage(current => current + 1)}
      className={className}
    />
  )
}
