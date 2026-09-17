'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowRight, CircleUserRound, Sparkles, Store, Volleyball } from 'lucide-react'
import { getErrorMessage } from '@/lib/api-error'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const DEMO_ACCOUNTS = [
  { role: 'Khách đặt sân', email: 'customer@test.com', icon: CircleUserRound },
  { role: 'Chủ sân', email: 'owner@test.com', icon: Store },
]

export default function LoginPage() {
  const { user, loading: authLoading, login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const redirectTarget = (role: string) => (role === 'OWNER' ? '/owner' : '/courts')

  useEffect(() => {
    if (!authLoading && user) router.replace(redirectTarget(user.role))
  }, [authLoading, router, user])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const signedIn = await login(email.trim(), password)
      router.replace(redirectTarget(signedIn.role))
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-20">
      <div className="hidden lg:block">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-600 to-teal-400 p-10 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.3),transparent_55%)]" />
          <Volleyball className="relative size-12" />
          <h1 className="relative mt-6 text-3xl font-bold leading-snug">
            Chào mừng trở lại với Sân Việt
          </h1>
          <p className="relative mt-4 max-w-sm text-emerald-50/90">
            Đăng nhập để đặt sân, theo dõi lịch chơi hoặc quản lý đơn đặt sân của sân bạn phụ trách.
          </p>
          <div className="relative mt-8 flex flex-col gap-2 text-sm text-emerald-50/90">
            <span className="flex items-center gap-2">
              <Sparkles className="size-4" /> Hơn 4 loại sân: bóng đá, cầu lông, tennis, pickleball
            </span>
            <span className="flex items-center gap-2">
              <Sparkles className="size-4" /> Chủ sân xác nhận đơn ngay trong ngày
            </span>
          </div>
        </div>
      </div>

      <Card className="mx-auto w-full max-w-md shadow-lg">
        <CardContent className="flex flex-col gap-6 pt-6">
          <div>
            <h2 className="text-2xl font-bold">Đăng nhập</h2>
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
                type="password"
                autoComplete="current-password"
                placeholder="Ít nhất 6 ký tự"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" disabled={submitting}>
              {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
              {!submitting && <ArrowRight data-icon="inline-end" />}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Chưa có tài khoản?{' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Đăng ký ngay
            </Link>
          </p>

          <div className="flex flex-col gap-2 rounded-xl border border-dashed p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Tài khoản demo (mật khẩu 123456)
            </p>
            {DEMO_ACCOUNTS.map(account => {
              const Icon = account.icon
              return (
                <Button
                  key={account.email}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() => {
                    setEmail(account.email)
                    setPassword('123456')
                  }}
                >
                  <Icon /> {account.role} — {account.email}
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}