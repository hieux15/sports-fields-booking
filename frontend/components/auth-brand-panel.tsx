/** Shared photo + wordmark panel for login / register. */

const AUTH_IMAGE =
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1400&q=80'

export function AuthBrandPanel({
  headline,
  support,
}: {
  headline: string
  support: string
}) {
  return (
    <div className="relative min-h-[220px] overflow-hidden text-white sm:min-h-[280px] lg:min-h-full lg:rounded-lg">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={AUTH_IMAGE}
        alt=""
        className="hero-photo absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/55 to-black/35" />
      <div className="relative flex h-full min-h-[220px] flex-col justify-end p-6 sm:min-h-[280px] sm:p-8 lg:min-h-[520px] lg:p-10">
        <p className="font-display text-4xl font-extrabold uppercase tracking-[0.08em] sm:text-5xl">
          Sân Việt
        </p>
        <h1 className="mt-3 max-w-sm text-xl font-bold tracking-tight sm:text-2xl">
          {headline}
        </h1>
        <p className="mt-2 max-w-sm text-sm text-white/80">{support}</p>
      </div>
    </div>
  )
}
