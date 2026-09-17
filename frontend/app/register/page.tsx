'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowRight, CheckCircle2, Sparkles, Volleyball } from 'lucide-react'
import { getErrorMessage } from '@/lib/api-error'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const BENEFITS = [
  'Đặt sân nhanh chỉ trong vài thao tác',
  'Theo dõi trạng thái đơn: chờ xác nhận, đã xác nhận, đã hủy',
  'Hủy đơn miễn phí trước giờ bắt đầu',
]

export default function RegisterPage() {
  const { user, loading: authLoading, register } = useAuth()
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(user.role === 'OWNER' ? '/owner' : '/courts')
    }
  }, [authLoading, router, user])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError('Mật khẩu cần tối thiểu 6 ký tự')
      return
    }
    if (password !== confirm) {
      setError('Mật khẩu nhập lại không khớp')
      return
    }
    setSubmitting(true)
    try {
      const created = await register({ email: email.trim(), password, name: name.trim() })
      router.replace(created.role === 'OWNER' ? '/owner' : '/courts')
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

return (
    <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-20">
      <div className="hidden lg:block">
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-800 via-emerald-600 to-teal-400 p-10 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.3),transparent_55%)]" />
          <Volleyball className="relative size-12" />
          <h1 className="relative mt-6 text-3xl font-bold leading-snug">
            Tham gia cộng đồng thể thao Sân Việt
          </h1>
          <p className="relative mt-4 max-w-sm text-emerald-50/90">
            Tạo tài khoản miễn phí để đặt sân và quản lý lịch chơi của bạn mọi lúc.
          </p>
          <div className="relative mt-8 flex flex-col gap-3 text-sm text-emerald-50/90">
            {BENEFITS.map(benefit => (
              <span key={benefit} className="flex items-start gap-2">
                <Sparkles className="mt-0.5 size-4 shrink-0" /> {benefit}
              </span>
            ))}
          </div>
        </div>
      </div>

      <Card className="mx-auto w-full max-w-md shadow-lg">
        <CardContent className="flex flex-col gap-6 pt-6">
          <div>
            <h2 className="text-2xl font-bold">Tạo tài khoản</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Chỉ mất chưa đến một phút để bắt đầu.
            </p>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Họ và tên</Label>
              <Input
                id="name"
                className="h-11"
                placeholder="Nguyễn Minh Anh"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  className="h-11"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Tối thiểu 6 ký tự"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirm">Nhập lại mật khẩu</Label>
                <Input
                  id="confirm"
                  className="h-11"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Nhập lại mật khẩu"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" disabled={submitting}>
              {submitting ? 'Đang tạo tài khoản...' : 'Đăng ký'}
              {!submitting && <ArrowRight data-icon="inline-end" />}
            </Button>
          </form>

          <p className="flex items-center justify-center gap-1.5 text-center text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-primary" />
            Bằng việc đăng ký, bạn đồng ý với điều khoản sử dụng của Sân Việt.
          </p>

          <p className="text-center text-sm text-muted-foreground">
            Đã có tài khoản?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Đăng nhập
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
