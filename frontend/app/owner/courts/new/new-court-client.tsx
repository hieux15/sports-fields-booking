'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Store } from 'lucide-react'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/api-error'
import type { CourtInput } from '@/lib/types'
import { useAuth } from '@/components/auth-provider'
import { CourtForm } from '@/components/court-form'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function NewCourtClient() {
  const { user, loading } = useAuth()
  const router = useRouter()

  if (!loading && (!user || user.role !== 'OWNER')) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <Store className="mx-auto size-12 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-bold">Khu vực dành cho chủ sân</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Đăng nhập bằng tài khoản chủ sân để tạo sân mới.
        </p>
        <Button className="mt-6" nativeButton={false} render={<Link href="/login" />}>
          Đăng nhập
        </Button>
      </div>
    )
  }

  const create = async (values: CourtInput) => {
    const court = await api.createCourt(values)
    toast.success(`Đã tạo sân ${court.name}`)
    router.push('/owner')
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
        <h1 className="mt-1 text-3xl font-bold">Thêm sân mới</h1>
        <p className="mt-2 text-muted-foreground">
          Điền thông tin sân để khách có thể tìm thấy và đặt lịch. Bạn có thể sửa lại bất cứ lúc nào.
        </p>
      </div>

      <CourtForm onSubmit={create} submitLabel="Tạo sân" />
    </section>
  )
}