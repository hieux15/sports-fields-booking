'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { LogOut, Mail, Phone, ShieldCheck, Store, UserRound } from 'lucide-react'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/api-error'
import { formatDate } from '@/lib/format'
import { useAuth } from '@/components/auth-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map(part => part[0])
    .join('')
    .toUpperCase()
}

export default function ProfilePage() {
  const { user, loading: authLoading, refresh, logout } = useAuth()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isDirty = Boolean(user && (name !== user.name || phone !== (user.phone ?? '')))

  useEffect(() => {
    if (!user) return
    setName(user.name)
    setPhone(user.phone ?? '')
  }, [user])

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('Vui lòng nhập họ và tên')
      return
    }
    setSaving(true)
    try {
      await api.updateMe({ name: name.trim(), phone: phone.trim() })
      await refresh()
      toast.success('Đã cập nhật hồ sơ')
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="mt-6 h-64 rounded-xl" />
      </section>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <UserRound className="mx-auto size-12 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-bold">Bạn cần đăng nhập</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Đăng nhập để xem và cập nhật thông tin cá nhân của bạn.
        </p>
        <Button className="mt-6" nativeButton={false} render={<Link href="/login" />}>
          Đăng nhập
        </Button>
      </div>
    )
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Tài khoản</p>
        <h1 className="mt-1 text-3xl font-bold">Hồ sơ cá nhân</h1>
        <p className="mt-2 text-muted-foreground">
          Cập nhật tên và số điện thoại để chủ sân liên hệ khi cần.
        </p>
      </div>

      <Card className="mb-6 shadow-sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground">
              {initials(user.name)}
            </div>
            <div>
              <p className="font-semibold">{user.name}</p>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="size-3.5" /> {user.email}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Thành viên từ {formatDate(user.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={user.role === 'OWNER' ? 'default' : 'secondary'}>
              {user.role === 'OWNER' ? (
                <>
                  <Store /> Chủ sân
                </>
              ) : (
                <>
                  <ShieldCheck /> Khách đặt sân
                </>
              )}
            </Badge>
            {user.role === 'OWNER' ? (
              <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/owner" />}>
                Khu vực chủ sân
              </Button>
            ) : (
              <Button size="sm" nativeButton={false} render={<Link href="/owner/setup" />}>
                <Store /> Đăng ký thành chủ sân
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <CardTitle>Thông tin liên hệ</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <form onSubmit={save} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="profile-name">Họ và tên</Label>
              <Input
                id="profile-name"
                className="h-11"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="profile-phone" className="flex items-center gap-1.5">
                <Phone className="size-4" /> Số điện thoại
              </Label>
              <Input
                id="profile-phone"
                className="h-11"
                inputMode="tel"
                placeholder="0901234567"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" onClick={logout}>
                <LogOut /> Đăng xuất
              </Button>
              <div className="flex flex-col gap-2 sm:flex-row-reverse">
                {isDirty && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setName(user.name)
                      setPhone(user.phone ?? '')
                      setError(null)
                    }}
                    disabled={saving}
                  >
                    Hoàn tác
                  </Button>
                )}
                <Button type="submit" disabled={saving || !isDirty}>
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}
