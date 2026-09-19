'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ArrowLeft, Store } from 'lucide-react'
import { api } from '@/lib/api'
import type { CourtInput } from '@/lib/types'
import { useAuth } from '@/components/auth-provider'
import { CourtForm } from '@/components/court-form'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function OwnerSetupClient() {
  const { user, loading, refresh } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user?.role === 'OWNER') router.replace('/owner')
  }, [loading, router, user])

  if (!loading && !user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <Store className="mx-auto size-12 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-bold">Đăng nhập để đăng ký sân</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tạo tài khoản trước, sau đó bạn có thể nhập thông tin sân đầu tiên.
        </p>
        <Button
          className="mt-6"
          nativeButton={false}
          render={<Link href="/login?returnTo=%2Fowner%2Fsetup" />}
        >
          Đăng nhập
        </Button>
      </div>
    )
  }

  const createOwner = async (values: CourtInput) => {
    const result = await api.becomeOwner(values)
    await refresh()
    toast.success(`Đã tạo sân ${result.court.name}`)
    router.push('/owner')
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/profile"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Về hồ sơ
      </Link>

      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Chủ sân</p>
        <h1 className="mt-1 text-3xl font-bold">Đăng ký sân đầu tiên</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Nhập thông tin sân bạn đang quản lý. Sau khi tạo xong, tài khoản sẽ chuyển sang khu vực chủ sân.
        </p>
      </div>

      {!loading && user && <CourtForm onSubmit={createOwner} submitLabel="Tạo sân và tiếp tục" />}
    </section>
  )
}
