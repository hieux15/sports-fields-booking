import type { Metadata, Viewport } from 'next'
import { Barlow_Condensed, Be_Vietnam_Pro } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/auth-provider'
import { AppShell } from '@/components/app-shell'
import { Toaster } from 'sonner'

const fontSans = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-be-vietnam',
  display: 'swap',
})

const fontDisplay = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-barlow-condensed',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Sân Việt — Đặt sân thể thao',
  description: 'Tìm và đặt sân thể thao gần bạn dễ dàng.',
}

/** Field green — matches --primary oklch(0.42 0.12 145) */
export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#1a6b35',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={`${fontSans.variable} ${fontDisplay.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
