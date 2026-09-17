import type { Metadata, Viewport } from 'next'
import { Be_Vietnam_Pro } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/auth-provider'
import { AppShell } from '@/components/app-shell'
import { Toaster } from 'sonner'

const fontSans = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-be-vietnam',
  display: 'swap',
})

export const metadata: Metadata = { title: 'Sân Việt — Đặt sân thể thao', description: 'Tìm và đặt sân thể thao gần bạn dễ dàng.' }
export const viewport: Viewport = { colorScheme: 'light', themeColor: '#087f5b' }
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="vi" className={fontSans.variable}><body className="font-sans antialiased"><AuthProvider><AppShell>{children}</AppShell></AuthProvider><Toaster richColors position="top-right" /></body></html> }
