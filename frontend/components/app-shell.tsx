'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronDown,
  CircleUserRound,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from './auth-provider'
import { isMockMode } from '@/lib/api-error'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

type NavItem = { href: string; label: string }

const CUSTOMER_NAV: NavItem[] = [
  { href: '/courts', label: 'Tìm sân' },
  { href: '/bookings', label: 'Đơn đặt sân' },
]

const OWNER_NAV: NavItem[] = [
  { href: '/owner', label: 'Tổng quan' },
  { href: '/owner/courts/new', label: 'Thêm sân' },
]

function isActive(path: string, href: string) {
  return href === '/' ? path === href : path === href || path.startsWith(`${href}/`)
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth()
  const path = usePathname()
  const [showMock, setShowMock] = useState(true)
  const items = user?.role === 'OWNER' ? OWNER_NAV : CUSTOMER_NAV
  const isAuthPage = path === '/login' || path === '/register'

  const nav = (
    <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-6">
      {items.map(item => {
        const active = isActive(path, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`border-l-2 px-3 py-2 text-sm transition-colors md:border-l-0 md:border-b-2 md:px-0 md:py-1 ${
              active
                ? 'border-primary bg-primary/5 font-semibold text-foreground md:bg-transparent'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header
        className={`sticky top-0 z-40 border-b border-border/80 ${
          isAuthPage ? 'bg-background' : 'bg-background/85 backdrop-blur-sm'
        }`}
      >
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href={user?.role === 'OWNER' ? '/owner' : '/courts'}
            className="font-display text-[1.45rem] font-extrabold uppercase tracking-[0.04em] text-foreground sm:text-[1.55rem]"
          >
            Sân Việt
          </Link>

          <nav className="hidden md:block">{nav}</nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {loading ? (
              <div className="size-9 animate-pulse rounded-md bg-muted" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" className="gap-2 px-2" />}>
                  <CircleUserRound />
                  <span className="hidden max-w-32 truncate sm:inline">{user.name}</span>
                  <ChevronDown className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="truncate text-sm font-medium">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    <p className="mt-1 text-xs font-medium text-primary">
                      {user.role === 'OWNER' ? 'Chủ sân' : 'Khách đặt sân'}
                    </p>
                  </div>
                  <DropdownMenuItem render={<Link href="/profile" />}>
                    <CircleUserRound /> Hồ sơ cá nhân
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>
                    <LogOut /> Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:inline-flex"
                  nativeButton={false}
                  render={<Link href="/register" />}
                >
                  Đăng ký
                </Button>
                <Button size="sm" nativeButton={false} render={<Link href="/login" />}>
                  Đăng nhập
                </Button>
              </div>
            )}

            <Sheet>
              <SheetTrigger
                className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted md:hidden"
                aria-label="Mở menu"
              >
                <Menu />
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle className="font-display text-xl font-extrabold uppercase tracking-[0.06em]">
                    Sân Việt
                  </SheetTitle>
                </SheetHeader>
                <div className="px-4">{nav}</div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {isMockMode() && showMock && (
          <div className="border-t border-amber-200/80 bg-amber-50/90 px-4 py-2 text-sm text-amber-950">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
              <span>Đang dùng dữ liệu mẫu (NEXT_PUBLIC_USE_MOCK=1)</span>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setShowMock(false)}
                aria-label="Đóng thông báo"
              >
                <X />
              </Button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/80 bg-secondary/35">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-10 sm:grid-cols-[1.2fr_.8fr] sm:px-6 lg:grid-cols-[1.4fr_1fr_1.2fr_.8fr] lg:gap-8">
          <div className="max-w-xs">
            <Link
              href="/courts"
              className="font-display text-2xl font-extrabold uppercase tracking-[0.04em] text-foreground"
            >
              Sân Việt
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Tìm sân phù hợp, chọn giờ chơi và đặt lịch dễ dàng.
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-foreground">Khám phá</p>
            <nav className="mt-4 flex flex-col items-start gap-2.5 text-sm text-muted-foreground">
              <Link className="transition-colors hover:text-foreground" href="/courts">
                Tìm sân
              </Link>
              <Link className="transition-colors hover:text-foreground" href="/bookings">
                Đơn đặt sân
              </Link>
            </nav>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-foreground">Chủ sân</p>
            <nav className="mt-4 flex flex-col items-start gap-2.5 text-sm text-muted-foreground">
              <Link className="transition-colors hover:text-foreground" href="/owner/setup">
                Đăng ký làm chủ sân
              </Link>
              <Link className="transition-colors hover:text-foreground" href="/owner">
                Quản lý sân
              </Link>
            </nav>
          </div>

          <div className="sm:justify-self-end">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-foreground">Tài khoản</p>
            <nav className="mt-4 flex flex-col items-start gap-2.5 text-sm text-muted-foreground">
              <Link className="transition-colors hover:text-foreground" href="/login">
                Đăng nhập
              </Link>
              <Link className="transition-colors hover:text-foreground" href="/register">
                Tạo tài khoản
              </Link>
              <Link className="transition-colors hover:text-foreground" href="/profile">
                Hồ sơ cá nhân
              </Link>
            </nav>
          </div>

          <div className="border-t border-border/80 pt-5 text-xs text-muted-foreground sm:col-span-2 lg:col-span-4 lg:flex lg:items-center lg:justify-between">
            <p>© 2026 Sân Việt</p>
            <p className="mt-1 lg:mt-0">Đặt sân thể thao đơn giản hơn mỗi ngày.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
