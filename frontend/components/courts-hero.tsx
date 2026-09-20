/**
 * Hero dùng chung cho trang danh sách sân và trạng thái loading của route,
 * để khung nhìn đầu tiên không bị nhảy khi dữ liệu tải xong.
 */

/** Hero photo — urban futsal / street court atmosphere. */
export const COURTS_HERO_IMAGE =
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1800&q=85'

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
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/75 sm:text-sm">
          Sân thể thao gần bạn
        </p>
        <h1 className="mt-0 max-w-xl text-2xl font-bold tracking-tight sm:text-3xl">
          Tìm sân đúng gu, đặt lịch đúng giờ.
        </h1>
        <p className="mt-2 max-w-md text-sm text-white/80 sm:text-base">
          Bóng đá, cầu lông và sân phố — chọn giờ, xác nhận, chơi.
        </p>

        <div className="relative mt-8 max-w-xl">{search}</div>
      </div>
    </section>
  )
}
