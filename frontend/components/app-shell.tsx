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
                ? 'border-primary font-medium text-foreground'
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
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-sm">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href={user?.role === 'OWNER' ? '/owner' : '/courts'}
            className="font-display text-2xl font-extrabold uppercase tracking-[0.06em] text-foreground sm:text-[1.65rem]"
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

      <footer className="border-t border-border/80">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
          <p className="font-display text-sm font-bold uppercase tracking-[0.08em] text-muted-foreground">
            Sân Việt
          </p>
        </div>
      </footer>
    </div>
  )
}
