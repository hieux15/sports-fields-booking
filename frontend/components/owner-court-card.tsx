'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CalendarCheck, Clock3, MapPin, Pencil, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/api-error'
import { courtTypeMeta } from '@/lib/court-type'
import { formatVND } from '@/lib/format'
import type { Court } from '@/lib/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

export function OwnerCourtCard({
  court,
  pendingCount = 0,
  onDeleted,
}: {
  court: Court
  pendingCount?: number
  onDeleted?: (id: string) => void
}) {
  const meta = courtTypeMeta(court.type)
  const Icon = meta.icon
  const [deleting, setDeleting] = useState(false)

  const remove = async () => {
    setDeleting(true)
    try {
      await api.deleteCourt(court.id)
      toast.success(`Đã xóa sân ${court.name}`)
      onDeleted?.(court.id)
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card className="shadow-none">
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div
            className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-cover bg-center text-white"
            style={{ backgroundImage: `url(${meta.image})` }}
          >
            <div className={`absolute inset-0 ${meta.overlay}`} />
            <Icon className="relative size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-semibold">{court.name}</h3>
              <Badge variant="secondary">{meta.label}</Badge>
              {pendingCount > 0 && <Badge variant="destructive">{pendingCount} đơn chờ</Badge>}
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-3.5" />
              {court.address || 'Chưa cập nhật địa chỉ'}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock3 className="size-3.5" />
                {court.openTime} – {court.closeTime}
              </span>
              <span className="font-semibold text-primary">
                {formatVND(Number(court.pricePerHour))}/giờ
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t pt-4">
          <Button size="sm" nativeButton={false} render={<Link href={`/owner/courts/${court.id}`} />}>
            <CalendarCheck /> Quản lý đơn
          </Button>
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href={`/owner/courts/${court.id}/edit`} />}
          >
            <Pencil /> Sửa
          </Button>
          <AlertDialog>
            <AlertDialogTrigger
              render={<Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" />}
              disabled={deleting}
            >
              <Trash2 /> Xóa
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xóa sân {court.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Chỉ xóa được khi sân không còn đơn đặt sân nào chưa hủy. Các đơn đã hủy sẽ bị xóa
                  kèm. Hành động này không thể hoàn tác.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Giữ lại</AlertDialogCancel>
                <AlertDialogAction onClick={remove} disabled={deleting}>
                  {deleting ? 'Đang xóa...' : 'Xóa sân'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}
