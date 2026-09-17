import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/auth-provider'
import { AppShell } from '@/components/app-shell'
import { Toaster } from 'sonner'
export const metadata: Metadata = { title: 'Sân Việt — Đặt sân thể thao', description: 'Tìm và đặt sân thể thao gần bạn dễ dàng.' }
export const viewport: Viewport = { colorScheme: 'light', themeColor: '#087f5b' }
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="vi"><body className="antialiased"><AuthProvider><AppShell>{children}</AppShell></AuthProvider><Toaster richColors position="top-right" /></body></html> }
