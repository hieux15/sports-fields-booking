'use client'

import { useEffect, useState } from 'react'

/** Shared photo + wordmark panel for login / register. */

const AUTH_IMAGE =
  'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1400&q=85'

const PANEL_SLIDES = [
  {
    label: 'Đặt sân dễ dàng',
    text: 'Chọn sân phù hợp. Đặt lịch dễ dàng.',
  },
  {
    label: 'Lịch chơi rõ ràng',
    text: 'Theo dõi mọi đơn đặt sân trong một nơi.',
  },
  {
    label: 'Chủ sân chủ động',
    text: 'Quản lý sân và xác nhận đơn nhanh chóng.',
  },
]

export function AuthBrandPanel({
  headline,
  support,
}: {
  headline: string
  support: string
}) {
  const [slideIndex, setSlideIndex] = useState(0)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSlideIndex(index => (index + 1) % PANEL_SLIDES.length)
    }, 5000)

    return () => window.clearInterval(interval)
  }, [])

  const slide = PANEL_SLIDES[slideIndex]

  return (
    <div className="relative min-h-[112px] overflow-hidden text-white sm:min-h-[160px] lg:min-h-[620px] lg:rounded-lg lg:shadow-[0_18px_45px_rgba(0,0,0,0.16)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={AUTH_IMAGE}
        alt=""
        className="hero-photo absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/55 to-black/35" />
      <div className="relative flex h-full min-h-[112px] flex-col justify-end p-5 sm:min-h-[160px] sm:p-8 lg:min-h-[620px] lg:p-10">
        <div className="mb-4 flex items-center gap-3 sm:mb-5">
          <span className="h-px w-10 bg-accent sm:w-14" />
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-accent">
            Sports booking
          </span>
        </div>
        <p className="font-display text-3xl font-extrabold uppercase tracking-[0.08em] sm:text-5xl">
          Sân Việt
        </p>
        <h1 className="mt-2 max-w-sm text-base font-bold tracking-tight sm:mt-3 sm:text-2xl">
          {headline}
        </h1>
        <p className="mt-2 hidden max-w-sm text-sm leading-relaxed text-white/80 sm:block">
          {support}
        </p>
        <div
          key={slide.label}
          aria-live="polite"
          className="court-list-item mt-4 max-w-xs sm:mt-6"
        >
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-accent">
            {slide.label}
          </p>
          <p className="mt-1 text-xs font-medium text-white/75 sm:text-sm">{slide.text}</p>
        </div>
      </div>
    </div>
  )
}
