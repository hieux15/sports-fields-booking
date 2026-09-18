'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { getErrorMessage } from '@/lib/api-error'
import { useAuth } from '@/components/auth-provider'
import { AuthBrandPanel } from '@/components/auth-brand-panel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RegisterPage() {
  const { user, loading: authLoading, register } = useAuth()
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
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
    <div className="mx-auto grid max-w-6xl lg:grid-cols-2 lg:items-stretch lg:px-6 lg:py-12">
      <AuthBrandPanel
        headline="Tham gia Sân Việt"
        support="Tạo tài khoản miễn phí để đặt sân và quản lý lịch chơi của bạn."
      />

      <div className="mx-auto flex w-full max-w-md flex-col justify-center gap-6 bg-card px-4 py-10 sm:px-6 lg:px-10 lg:py-12 lg:ring-1 lg:ring-border/80">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tạo tài khoản</h2>
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
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Tối thiểu 6 ký tự"
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm">Nhập lại mật khẩu</Label>
              <Input
                id="confirm"
                className="h-11"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                className="self-end text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setShowConfirm(value => !value)}
              >
                {showConfirm ? <EyeOff className="mr-1 inline size-3.5" /> : <Eye className="mr-1 inline size-3.5" />}
                {showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" disabled={submitting} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {submitting ? 'Đang tạo tài khoản...' : 'Đăng ký'}
            {!submitting && <ArrowRight data-icon="inline-end" />}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Bằng việc đăng ký, bạn đồng ý với điều khoản sử dụng của Sân Việt.
        </p>

        <p className="text-center text-sm text-muted-foreground">
          Đã có tài khoản?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  )
}
