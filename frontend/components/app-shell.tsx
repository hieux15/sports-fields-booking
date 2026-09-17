'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarDays,
  ChevronDown,
  CircleUserRound,
  LogOut,
  Menu,
  Plus,
  Search,
  Sparkles,
  Store,
  Volleyball,
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

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> }

const CUSTOMER_NAV: NavItem[] = [
  { href: '/courts', label: 'Tìm sân', icon: Search },
  { href: '/bookings', label: 'Đơn đặt sân', icon: CalendarDays },
]

const OWNER_NAV: NavItem[] = [
  { href: '/owner', label: 'Tổng quan', icon: Store },
  { href: '/owner/courts/new', label: 'Thêm sân', icon: Plus },
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
    <div className="flex flex-col gap-1 md:flex-row md:items-center">
      {items.map(item => {
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive(path, item.href)
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        )
      })}
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/70">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href={user?.role === 'OWNER' ? '/owner' : '/courts'}
            className="flex items-center gap-2.5"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-700 to-teal-400 text-white shadow-sm">
              <Volleyball className="size-5" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-lg font-bold tracking-tight">Sân Việt</span>
              <span className="text-[0.7rem] text-muted-foreground">Đặt sân thể thao</span>
            </span>
          </Link>

          <nav className="hidden md:block">{nav}</nav>

          <div className="flex items-center gap-2">
            {loading ? (
              <div className="size-10 animate-pulse rounded-full bg-muted" />
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
              <div className="flex items-center gap-2">
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
                className="inline-flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted md:hidden"
                aria-label="Mở menu"
              >
                <Menu />
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Điều hướng</SheetTitle>
                </SheetHeader>
                <div className="px-4">{nav}</div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {isMockMode() && showMock && (
          <div className="border-t bg-amber-50 px-4 py-2 text-sm text-amber-900">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <Sparkles className="size-4" />
                Đang dùng dữ liệu mẫu (NEXT_PUBLIC_USE_MOCK=1)
              </span>
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

      <footer className="border-t bg-background">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Sân Việt — Nền tảng đặt sân thể thao.</p>
          <div className="flex items-center gap-4">
            <Link href="/courts" className="hover:text-foreground">
              Danh sách sân
            </Link>
            <Link href="/bookings" className="hover:text-foreground">
              Đơn đặt sân
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
