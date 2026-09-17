'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, Store } from 'lucide-react'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/api-error'
import type { Court, CourtInput } from '@/lib/types'
import { useAuth } from '@/components/auth-provider'
import { CourtForm } from '@/components/court-form'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

export function EditCourtClient({ id }: { id: string }) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [court, setCourt] = useState<Court | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user || user.role !== 'OWNER') {
      setLoading(false)
      return
    }
    let active = true
    api
      .court(id)
      .then(data => {
        if (active) setCourt(data)
      })
      .catch(e => {
        if (active) setError(getErrorMessage(e))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [authLoading, id, user])

  const save = async (values: CourtInput) => {
    const updated = await api.updateCourt(id, values)
    toast.success(`Đã cập nhật sân ${updated.name}`)
    router.push('/owner')
  }

  if (!authLoading && (!user || user.role !== 'OWNER')) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <Store className="mx-auto size-12 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-bold">Khu vực dành cho chủ sân</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Đăng nhập bằng tài khoản chủ sân để chỉnh sửa thông tin sân.
        </p>
        <Button className="mt-6" nativeButton={false} render={<Link href="/login" />}>
          Đăng nhập
        </Button>
      </div>
    )
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/owner"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Về tổng quan
      </Link>

      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          Khu vực chủ sân
        </p>
        <h1 className="mt-1 text-3xl font-bold">Sửa thông tin sân</h1>
        <p className="mt-2 text-muted-foreground">
          Cập nhật giá thuê, khung giờ hoạt động và địa chỉ để khách đặt sân chính xác hơn.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : error || !court ? (
        <div className="rounded-2xl border border-dashed px-6 py-14 text-center">
          <Store className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-3 font-semibold">Không tải được sân này</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {error ?? 'Sân không tồn tại hoặc không thuộc quyền quản lý của bạn.'}
          </p>
          <Button className="mt-5" variant="outline" nativeButton={false} render={<Link href="/owner" />}>
            <ArrowLeft /> Về tổng quan
          </Button>
        </div>
      ) : (
        <CourtForm
          key={court.id}
          court={court}
          onSubmit={save}
          onCancel={() => router.push('/owner')}
        />
      )}
    </section>
  )
}