/**
 * Hero dùng chung cho trang danh sách sân và trạng thái loading của route,
 * để khung nhìn đầu tiên không bị nhảy khi dữ liệu tải xong.
 */

/** Hero photo — urban futsal / street court atmosphere. */
export const COURTS_HERO_IMAGE =
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1800&q=80'

export function CourtsHero({
  search,
  animated = true,
}: {
  /** Slot cho ô tìm kiếm (input thật hoặc skeleton lúc đang tải). */
  search?: React.ReactNode
  /** Tắt hiệu ứng fade-in khi hero chỉ là khung xương lúc chuyển route. */
  animated?: boolean
}) {
  return (
    <section className="relative min-h-[min(72vh,560px)] overflow-hidden text-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={COURTS_HERO_IMAGE}
        alt=""
        fetchPriority="high"
        decoding="async"
        className={`${animated ? 'hero-photo ' : ''}absolute inset-0 size-full object-cover`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/50 to-black/35" />

      <div className="relative mx-auto flex min-h-[min(72vh,560px)] max-w-7xl flex-col justify-end px-4 pb-12 pt-20 sm:px-6 sm:pb-16">
        <p className="font-display text-5xl font-extrabold uppercase tracking-[0.08em] sm:text-6xl md:text-7xl">
          Sân Việt
        </p>
        <h1 className="mt-3 max-w-xl text-2xl font-bold tracking-tight sm:text-3xl">
          Tìm sân gần bạn, đặt lịch nhanh.
        </h1>
        <p className="mt-2 max-w-md text-sm text-white/80 sm:text-base">
          Bóng đá, cầu lông và sân phố — chọn giờ, xác nhận, chơi.
        </p>

        <div className="relative mt-8 max-w-xl">{search}</div>
      </div>
    </section>
  )
}
