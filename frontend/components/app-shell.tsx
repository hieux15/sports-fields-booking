'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, ChevronDown, CircleUserRound, LogOut, MapPin, Menu, Trophy, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from './auth-provider'
import { isMockMode } from '@/lib/api-error'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth()
  const path = usePathname()
  const [showMock, setShowMock] = useState(true)
  const links = user?.role === 'OWNER' ? [{ href: '/owner', label: 'Tổng quan' }, { href: '/owner/courts/new', label: 'Thêm sân' }] : [{ href: '/courts', label: 'Tìm sân' }, ...(user ? [{ href: '/bookings', label: 'Đơn đặt sân' }] : [])]
  const nav = <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-1">{links.map(link => <Link key={link.href} href={link.href} className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${path === link.href ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>{link.label}</Link>)}</div>
  return <div className="min-h-screen bg-slate-50/70">
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6"><Link href={user?.role === 'OWNER' ? '/owner' : '/courts'} className="flex items-center gap-2"><span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Trophy /></span><span className="text-lg font-bold tracking-tight">Sân Việt</span></Link><nav className="hidden md:block">{nav}</nav><div className="flex items-center gap-2">{loading ? <div className="size-9 animate-pulse rounded-full bg-muted" /> : user ? <DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" className="gap-2" />}><CircleUserRound /><span className="hidden max-w-28 truncate sm:inline">{user.name}</span><ChevronDown /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem render={<Link href="/profile" />}>Hồ sơ cá nhân</DropdownMenuItem><DropdownMenuItem onClick={logout}><LogOut /> Đăng xuất</DropdownMenuItem></DropdownMenuContent></DropdownMenu> : <Button size="sm" nativeButton={false} render={<Link href="/login" />}>Đăng nhập</Button>}<Sheet><SheetTrigger className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted md:hidden" aria-label="Mở menu"><Menu /></SheetTrigger><SheetContent><SheetTitle className="sr-only">Điều hướng</SheetTitle>{nav}</SheetContent></Sheet></div></div></header>
    {isMockMode() && showMock && <div className="border-b bg-amber-50 px-4 py-2 text-sm text-amber-900"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3"><span>Đang dùng dữ liệu mẫu</span><Button variant="ghost" size="icon" className="size-7" onClick={() => setShowMock(false)} aria-label="Đóng thông báo"><X /></Button></div></div>}
    <main>{children}</main>
  </div>
}
