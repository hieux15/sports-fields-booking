'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { getErrorMessage } from '@/lib/api-error'
import { isMockMode } from '@/lib/api-error'
import { useAuth } from '@/components/auth-provider'
import { AuthBrandPanel } from '@/components/auth-brand-panel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const DEMO_ACCOUNTS = [
  { role: 'Khách đặt sân', email: 'customer@test.com' },
  { role: 'Chủ sân', email: 'owner@test.com' },
]

export default function LoginPage() {
  const { user, loading: authLoading, login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const redirectTarget = (role: string) => (role === 'OWNER' ? '/owner' : '/courts')
  const getReturnTo = () => {
    if (typeof window === 'undefined') return null
    const returnTo = new URLSearchParams(window.location.search).get('returnTo')
    return returnTo?.startsWith('/') && !returnTo.startsWith('//') ? returnTo : null
  }

  useEffect(() => {
    if (!authLoading && user) router.replace(getReturnTo() ?? redirectTarget(user.role))
  }, [authLoading, router, user])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const signedIn = await login(email.trim(), password)
      router.replace(getReturnTo() ?? redirectTarget(signedIn.role))
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl lg:grid-cols-2 lg:items-stretch lg:px-6 lg:py-12">
      <AuthBrandPanel
        headline="Chào mừng trở lại"
        support="Đăng nhập để đặt sân, theo dõi lịch chơi hoặc quản lý đơn của sân bạn."
      />

      <div className="mx-auto flex w-full max-w-md flex-col justify-center gap-6 bg-card px-4 py-10 sm:px-6 lg:px-10 lg:py-12 lg:ring-1 lg:ring-border/80">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Đăng nhập</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Dùng email và mật khẩu của bạn để tiếp tục.
          </p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              className="h-11"
              type="email"
              autoComplete="email"
              placeholder="ban@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              className="h-11"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Ít nhất 6 ký tự"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <button
              type="button"
              className="self-end text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword(value => !value)}
            >
              {showPassword ? <EyeOff className="mr-1 inline size-3.5" /> : <Eye className="mr-1 inline size-3.5" />}
              {showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            </button>
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" disabled={submitting} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
            {!submitting && <ArrowRight data-icon="inline-end" />}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Chưa có tài khoản?{' '}
          <Link
            href={`/register${getReturnTo() ? `?returnTo=${encodeURIComponent(getReturnTo()!)}` : ''}`}
            className="font-medium text-primary hover:underline"
          >
            Đăng ký ngay
          </Link>
        </p>

        {isMockMode() && <div className="border-t border-border/80 pt-4">
          <p className="text-xs text-muted-foreground">Tài khoản demo — mật khẩu 123456</p>
          <div className="mt-2 flex flex-col gap-1">
            {DEMO_ACCOUNTS.map(account => (
              <button
                key={account.email}
                type="button"
                className="rounded-md px-1 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-muted/80"
                onClick={() => {
                  setEmail(account.email)
                  setPassword('123456')
                }}
              >
                <span className="font-medium">{account.role}</span>
                <span className="text-muted-foreground"> — {account.email}</span>
              </button>
            ))}
          </div>
        </div>}
      </div>
    </div>
  )
}
